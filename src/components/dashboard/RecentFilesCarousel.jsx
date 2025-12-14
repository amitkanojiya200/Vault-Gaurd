// src/components/RecentFilesCarousel.jsx
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Clipboard, ExternalLink } from 'lucide-react'

export default function RecentFilesCarousel({ files = [] }) {
  const [preview, setPreview] = useState(null)
  const [copied, setCopied] = useState(false)

  async function openFile(path) {
    // Try common native bridges (Tauri, Electron). If none, fallback to copy path.
    try {
      // Tauri (recommended) — user must implement command in backend
      if (window.__TAURI__ && window.__TAURI__.invoke) {
        await window.__TAURI__.invoke('open_path', { path })
        return
      }
      // If running in Electron (preload exposes openPath)
      if (window.openFilePath) {
        window.openFilePath(path)
        return
      }
      // Fallback: attempt to use the File System Access API (only with user action & permissions)
      // Not safe to auto-open arbitrary local paths from the browser — copy to clipboard instead
      await navigator.clipboard.writeText(path)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch (err) {
      // still fallback
      try {
        await navigator.clipboard.writeText(path)
        setCopied(true)
        setTimeout(() => setCopied(false), 2200)
      } catch (e) {
        alert('Cannot open file from browser. Path copied: ' + path)
      }
    }
  }

  return (
    <>
      <div className="overflow-x-auto py-2">
        <div className="flex gap-4 min-w-max">
          {files.map((f) => (
            <motion.div
              key={f.id}
              whileHover={{ scale: 1.03 }}
              className="w-64 p-3 rounded-lg bg-[var(--bg-light-soft)] dark:bg-[var(--bg-dark-soft)] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)]"
            >
              <div className="h-28 bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] rounded mb-3 flex items-center justify-center">
                <div className="text-xs text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">{f.type}</div>
              </div>

              <div className="text-sm font-semibold text-[var(--navy)] dark:text-[var(--soft-white)]">{f.name}</div>
              <div className="text-xs mt-1 text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">{f.date}</div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => openFile(f.path)}
                  className="px-3 py-1 rounded bg-[var(--coastal)] text-white text-xs flex items-center gap-2"
                >
                  <ExternalLink size={12} /> Open
                </button>

                <button
                  onClick={() => setPreview(f)}
                  className="px-3 py-1 rounded border border-[var(--coastal)] text-[var(--coastal)] text-xs flex items-center gap-2"
                >
                  Preview
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(f.path).then(() => {
                      setCopied(true)
                      setTimeout(() => setCopied(false), 1600)
                    })
                  }}
                  className="ml-auto text-xs text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)] flex items-center gap-2"
                  title="Copy path"
                >
                  <Clipboard size={14} /> Copy
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-2xl p-6 rounded-lg bg-[var(--bg-light-soft)] dark:bg-[var(--bg-dark-soft)]">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded bg-[var(--coastal)] text-white flex items-center justify-center text-xl font-semibold">
                {preview.type}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--navy)] dark:text-[var(--soft-white)]">{preview.name}</h3>
                <div className="text-xs text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)] mt-1">{preview.path}</div>

                <div className="mt-4">
                  <p className="text-sm text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">
                    Quick preview placeholder — integrate document renderers (PDF viewer, image preview, office viewer) in the native layer or with JS libraries later.
                  </p>

                  <div className="mt-4 flex gap-2">
                    <button onClick={() => openFile(preview.path)} className="px-4 py-2 bg-[var(--coastal)] text-white rounded">Open</button>
                    <button onClick={() => { navigator.clipboard.writeText(preview.path); setCopied(true); setTimeout(()=>setCopied(false),1600) }} className="px-4 py-2 border border-[var(--coastal)] text-[var(--coastal)] rounded">Copy Path</button>
                    <button onClick={() => setPreview(null)} className="px-4 py-2 text-[var(--navy)] dark:text-[var(--soft-white)] rounded">Close</button>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}

      {/* small copied toast */}
      {copied && (
        <div className="fixed right-6 bottom-6 bg-[var(--coastal)] text-white px-4 py-2 rounded shadow-lg">
          Path copied to clipboard
        </div>
      )}
    </>
  )
}
