// src/components/ModalPdfViewer.jsx
import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

/**
 * Environment checks
 */
const isBrowser = typeof window !== "undefined" && typeof window.location !== "undefined" && String(window.location.origin).startsWith("http");
const isTauri = typeof window !== "undefined" && window.__TAURI__ !== undefined;

/**
 * Resolve a supplied path into a usable src for an <iframe>.
 * - Leaves http(s), data:, blob:, and asset:// untouched.
 * - For leading-slash paths ("/docs/...") in a browser, prefix with window.location.origin.
 * - For other relative paths or in non-http env, use asset://
 */
function resolvePdfUrl(raw) {
  if (!raw) return "";

  const s = String(raw).trim();

  // If already a full URL or special scheme, return as-is (but convert asset:// into origin if in browser)
  const low = s.toLowerCase();
  if (low.startsWith("http://") || low.startsWith("https://") || low.startsWith("blob:") || low.startsWith("data:") || low.startsWith("file://")) {
    return s;
  }
  if (low.startsWith("asset://")) {
    // If running in a browser (dev/hosted) and not in real Tauri, convert to origin path
    if (isBrowser && !isTauri) {
      const after = s.replace(/^asset:\/\//i, "").replace(/^\/+/, "");
      return `${window.location.origin}/${after}`;
    }
    return s;
  }

  // Not a scheme: treat as relative path
  const normalized = s.startsWith("/") ? s : `/${s}`;

  if (isBrowser) {
    return `${window.location.origin}${normalized}`;
  }

  // fallback for packaged apps
  return `asset://${normalized.replace(/^\/+/, "")}`;
}

/**
 * ModalPdfViewer
 * Strategies (in order):
 * 1) iframe with resolved fileUrl
 * 2) Google Docs Viewer (web only) if iframe doesn't load promptly or errors
 * 3) fallback: embed / download UI
 */
export default function ModalPdfViewer({ title, src, url, onClose }) {
  const raw = src ?? url ?? "";
  const resolved = resolvePdfUrl(raw);
  const [fileUrl, setFileUrl] = useState(resolved);
  const [mode, setMode] = useState("iframe"); // 'iframe' | 'google' | 'embed' | 'download'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // refs for detection
  const iframeRef = useRef(null);
  const loadTimeoutRef = useRef(null);

  useEffect(() => {
    setFileUrl(resolvePdfUrl(raw));
    setMode("iframe");
    setError(false);
    setLoading(true);
  }, [raw]);

  // helper: Google docs viewer url
  const googleViewerUrl = fileUrl && !isTauri ? `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true` : null;

  useEffect(() => {
    // Clear any timeout when unmounting/changing
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, []);

  // Called when iframe fires load
  const handleIframeLoad = () => {
    // If we already moved to google mode, ignore
    if (mode !== "iframe") return;

    // Mark loaded and cancel fallback timer.
    setLoading(false);
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

    // Very small delay to ensure content renders; remain in iframe mode.
    setTimeout(() => {
      setLoading(false);
      setError(false);
    }, 150);
  };

  // Called when iframe errors or when we decide it's not rendering and should fallback
  const triggerGoogleFallback = (reason) => {
    // Only attempt google fallback if we are in a web browser (not Tauri)
    if (!isTauri && googleViewerUrl) {
      console.warn("[ModalPdfViewer] switching to Google Viewer fallback:", reason, googleViewerUrl);
      setMode("google");
      setLoading(true);
      // no need to set a timeout here - google viewer will load by iframe normally
      return;
    }

    // Otherwise, go to embed / download fallback
    console.warn("[ModalPdfViewer] switching to embed/download fallback:", reason, fileUrl);
    setMode("embed");
    setLoading(false);
    setError(true);
  };

  // Start a short timer after mounting an iframe; if it doesn't report load, try google fallback.
  useEffect(() => {
    if (!fileUrl) {
      setError(true);
      setLoading(false);
      return;
    }

    if (mode === "iframe") {
      // Give the browser a reasonable time to start rendering the PDF.
      // Some servers respond 200 but block embedding via X-Frame-Options; iframe won't error — so we use timeout fallback.
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);

      loadTimeoutRef.current = setTimeout(() => {
        // If iframe didn't fire load within X ms, attempt google fallback (web only)
        // We check if iframe's contentDocument has any content, but cross-origin may block that.
        // So we use time-based heuristic: if still in iframe mode & loading is true -> fallback.
        if (mode === "iframe" && loading) {
          triggerGoogleFallback("iframe did not load quickly");
        }
      }, 1500); // 1.5s heuristic - tweak if needed
    }

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, mode]);

  // iframe onError handler
  const handleIframeError = (ev) => {
    console.error("[ModalPdfViewer] iframe error:", ev);
    triggerGoogleFallback("iframe error event");
  };

  // Download helper
  const handleDownload = (e) => {
    e.preventDefault();
    if (!fileUrl) return;
    if (isTauri) {
      // In Tauri you'd call the Tauri API to save/open the file
      alert("Download in Tauri requires Tauri API integration.\nFile: " + fileUrl);
    } else {
      const a = document.createElement("a");
      a.href = fileUrl;
      a.target = "_blank";
      a.download = title || "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // UI for the document area (keeps your look)
  const DocumentArea = () => {
    const lc = (fileUrl || "").toLowerCase();
    const isPdf = lc.endsWith(".pdf");
    const isPpt = lc.endsWith(".pptx") || lc.endsWith(".ppt");

    if (!fileUrl) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-slate-600">No document specified</div>
        </div>
      );
    }

    if (isPpt) {
      // PPT: Google viewer web fallback (if available); otherwise ask to download in Tauri.
      if (!isTauri && googleViewerUrl) {
        return (
          <iframe
            src={encodedSrc}
            title={title}
            className="w-full h-full border-0"
            style={{ backgroundColor: 'white' }}
            onLoad={() => { setLoading(false); setError(false); }}
            onError={() => { setLoading(false); setError(true); }}
          />
        );
      }
      // Tauri / fallback: download prompt
      return (
        <div className="flex flex-col items-center justify-center h-full p-4">
          <h3 className="text-lg font-semibold mb-2">PowerPoint Presentation</h3>
          <p className="text-slate-600 mb-4">PowerPoint files cannot be previewed directly. Please download to view.</p>
          <button onClick={handleDownload} className="px-4 py-2 bg-blue-600 text-white rounded">Download PowerPoint</button>
        </div>
      );
    }

    // For PDFs: try modes
    if (mode === "iframe") {
      // Primary: direct iframe to fileUrl
      return (
        <iframe
          ref={iframeRef}
          src={fileUrl}
          className="w-full h-full border-0"
          title={title}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{ backgroundColor: "white" }}
        />
      );
    }

    if (mode === "google" && googleViewerUrl) {
      return (
        <iframe
          src={googleViewerUrl}
          className="w-full h-full border-0"
          title={title}
          onLoad={() => { setLoading(false); setError(false); }}
          onError={() => { setLoading(false); setError(true); }}
        />
      );
    }

    if (mode === "embed") {
      // embed tag sometimes works where iframe fails
      return (
        <embed
          src={fileUrl}
          type="application/pdf"
          className="w-full h-full"
          onError={() => { setError(true); setLoading(false); }}
        />
      );
    }

    // final fallback: download prompt
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <h3 className="text-lg font-semibold mb-2">Document Viewer</h3>
        <p className="text-slate-600 mb-4">This document may not be supported for preview. You can download it to view externally.</p>
        <button onClick={handleDownload} className="px-4 py-2 bg-blue-600 text-white rounded">Download Document</button>
      </div>
    );
  };

  // Main render
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative z-10 w-[95%] max-w-6xl h-[90%] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <h3 className="text-sm font-semibold truncate max-w-[60ch] text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <div className="flex items-center gap-2">
            {error && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition"
              >
                Download
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center gap-2 rounded-lg bg-slate-200 dark:bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
        </div>

        {/* document area */}
        <div className="flex-1 overflow-hidden bg-slate-100 dark:bg-slate-900">
          <DocumentArea />
        </div>
      </div>
    </div>
  );
}
