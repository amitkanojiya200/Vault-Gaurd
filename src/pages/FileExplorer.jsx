// src/pages/FileExplorer.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
    Folder,
    FileIcon,
    ChevronRight,
    ChevronLeft,
    Search,
    HardDrive,
    Tag,
} from 'lucide-react';

import bgImage2 from '../assets/dbg2.png';
import sessionClient from '@/lib/sessionClient';
import * as fsClient from '@/lib/fsClient';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import path from 'path-browserify'; // Helper for cross-platform path operations in browser context
// ---------------------------
// Mock tags (kept for UI fallback / demo)
// ---------------------------
const SYSTEM_TAGS = [
    { id: 'star', name: 'Star', color: 'bg-green-500/15 text-green-500' },
    { id: 'imp', name: 'IMP', color: 'bg-yellow-500/15 text-yellow-500' },
    { id: 'conf', name: 'Conf', color: 'bg-red-500/15 text-red-500' },
];

const MOCK_ITEM_TAGS = {
    'C:\\OPS\\Plans\\Op-Alpha-Plan.docx': ['star', 'imp'],
    'C:\\OPS\\Plans\\Op-Delta-Plan.docx': ['star'],
    'C:\\TRAINING\\Pollution-Response-Manual.pdf': ['imp'],
};

// ---------------------------
// path normalizer
// ---------------------------
function normalizeFrontendPath(p) {
    if (!p) return p;
    let s = String(p);
    if (s.startsWith('\\\\?\\')) {
        s = s.slice(4);
    }
    s = s.replace(/\//g, '\\');
    s = s.replace(/[\\\/]+$/, '');
    return s;
}

// prepare normalized initial tags map (plain constant — NOT hooks)
const initialItemTags = Object.keys(MOCK_ITEM_TAGS).reduce((acc, k) => {
    acc[normalizeFrontendPath(k)] = MOCK_ITEM_TAGS[k];
    return acc;
}, {});

function formatSize(size) {
    if (size == null) return '—';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getTagsForPath(path, itemTagsMap) {
    const key = normalizeFrontendPath(path);
    const ids = itemTagsMap[key] || [];
    return SYSTEM_TAGS.filter((t) => ids.includes(t.id));
}

// tolerant invoke helper
async function invokeAny(commandCandidates = [], payload = {}) {
    let lastErr = null;
    for (const cmd of commandCandidates) {
        try {
            const res = await invoke(cmd, payload);
            return res;
        } catch (e) {
            lastErr = e;
        }
    }
    const err = new Error(`None of commands ${JSON.stringify(commandCandidates)} succeeded. Last: ${String(lastErr)}`);
    err.cause = lastErr;
    throw err;
}

function buildPayloadForSearch(sessionToken, query, opts = {}) {
    const windowVal = opts.window || '24h';
    const limitVal = opts.limit ?? 500;
    const offsetVal = opts.offset ?? 0;

    return {
        session_token: sessionToken,
        sessionToken: sessionToken,
        q: query,
        query: query,
        q_string: query,
        window: windowVal,
        time_window: windowVal,
        limit: limitVal,
        max: limitVal,
        count: limitVal,
        offset: offsetVal,
    };
}

function buildPayloadForFileOp(sessionToken, params = {}) {
    const p = {
        session_token: sessionToken,
        sessionToken: sessionToken,
        path: params.path,
        src: params.src,
        src_path: params.src_path,
        source: params.source,
        old_path: params.old_path,
        oldPath: params.oldPath,
        dest: params.dest,
        dest_path: params.dest_path,
        destPath: params.destPath,
        target: params.target,
        tag: params.tag,
        tags: params.tags,
        recursive: params.recursive,
    };
    Object.keys(p).forEach(k => p[k] === undefined && delete p[k]);
    return p;
}

// ---------------------------------------------------------------------
// FileExplorer Component
// ---------------------------------------------------------------------
export default function FileExplorer() {
    // drives and current folder
    const [drives, setDrives] = useState([]);
    const [drivesLoading, setDrivesLoading] = useState(false);

    const [currentPath, setCurrentPath] = useState('');
    const [folderItems, setFolderItems] = useState([]);
    const [folderLoading, setFolderLoading] = useState(false);

    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const [selectedItem, setSelectedItem] = useState(null);

    // search
    const [query, setQuery] = useState('');
    const [searchMode, setSearchMode] = useState(false);

    // tag view (real tags should come from backend; we keep a client-side map that we sync with backend)
    const [activeTagId, setActiveTagId] = useState(null);
    // use the normalized initial tags map we built above
    const [itemTagsMap, setItemTagsMap] = useState(initialItemTags);

    // global search results (populated by handleSubmitSearch)
    const [globalSearchResults, setGlobalSearchResults] = useState([]);
    const [globalSearchLoading, setGlobalSearchLoading] = useState(false);

    // view tab: 'folder' or 'global'
    const [viewTab, setViewTab] = useState('folder');

    // Tag operation loading map: { "<tagId>": true }
    const [tagOpLoading, setTagOpLoading] = useState({});

    // breadcrumb segments
    const pathSegments = useMemo(() => {
        if (!currentPath) return [];
        return currentPath.split(/[/\\]/).filter(Boolean);
    }, [currentPath]);

    const canGoBack = historyIndex > 0;
    const canGoForward = historyIndex < history.length - 1;

    // derived items
    const listItems = useMemo(() => {
        // If we're explicitly showing global results, return them directly
        if (viewTab === 'global') {
            return globalSearchResults || [];
        }

        // Tag filter while viewing a folder: show only items in current folder that have the tag
        if (activeTagId) {
            if (activeTagId === 'recent') return []; // 'recent' handled elsewhere / requires indexing
            return folderItems.filter((item) => {
                const key = item.normPath || normalizeFrontendPath(item.path);
                const tags = itemTagsMap[key] || [];
                return tags.includes(activeTagId);
            });
        }

        // Folder search by query
        if (query.trim()) {
            const q = query.toLowerCase();
            return folderItems.filter((item) => item.name.toLowerCase().includes(q));
        }

        // Default: show current folder items
        return folderItems;
    }, [viewTab, globalSearchResults, activeTagId, folderItems, query, itemTagsMap]);

    const listContextLabel = useMemo(() => {
        if (viewTab === 'global') {
            return `Global search · ${globalSearchResults?.length ?? 0} item(s)`;
        }

        if (activeTagId) {
            if (activeTagId === 'recent') return 'Recent items';
            const count = folderItems.reduce((acc, item) => {
                const key = item.normPath || normalizeFrontendPath(item.path);
                const tags = itemTagsMap[key] || [];
                return acc + (tags.includes(activeTagId) ? 1 : 0);
            }, 0);
            const tagName = SYSTEM_TAGS.find(t => t.id === activeTagId)?.name || activeTagId;
            return `${tagName} · ${count} item(s)`;
        }

        if (query.trim()) return `Search this folder: "${query}" · ${folderItems.length} item(s)`;

        return `Current folder · ${folderItems.length} item(s)`;
    }, [viewTab, globalSearchResults, activeTagId, folderItems, query, itemTagsMap]);

    // ---------------------------
    // Load drives and folder contents
    // ---------------------------
    useEffect(() => {
        let active = true;
        async function loadDrives() {
            setDrivesLoading(true);
            try {
                const token = await sessionClient.getSessionToken();
                if (!token) {
                    setDrives([]);
                    return;
                }
                const ds = await fsClient.listDrives(token);
                if (!active) return;
                setDrives(ds || []);
                if (!currentPath && ds && ds.length > 0) {
                    const prefer = ds[0].mount_point || ds[0].id || ds[0].drive || ds[0].label;
                    navigateTo(prefer);
                }
            } catch (err) {
                console.error('[FileExplorer] listDrives failed:', err);
                setDrives([]);
            } finally {
                if (active) setDrivesLoading(false);
            }
        }
        loadDrives();
        return () => { active = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // whenever currentPath changes, load folder contents
    useEffect(() => {
        let active = true;
        async function loadFolder() {
            if (!currentPath) {
                setFolderItems([]);
                return;
            }
            setFolderLoading(true);
            try {
                const token = await sessionClient.getSessionToken();
                const items = await fsClient.listDir(token, currentPath);
                if (!active) return;
                setFolderItems((items || []).map((it) => ({
                    name: it.name,
                    isDir: !!it.is_dir,
                    size: it.size == null ? null : it.size,
                    modified: it.modified ? new Date(it.modified * 1000).toISOString().replace('T', ' ').slice(0, 19) : null,
                    path: it.path,
                    normPath: normalizeFrontendPath(it.path),
                })));
            } catch (err) {
                console.error('[FileExplorer] listDir failed for', currentPath, err);
                setFolderItems([]);
            } finally {
                if (active) setFolderLoading(false);
            }
        }
        loadFolder();
        return () => { active = false; };
    }, [currentPath]);

    useEffect(() => {
        let mounted = true;
        async function loadTags() {
            if (!selectedItem) return;
            try {
                let token = null;
                try { token = await sessionClient.getSessionToken(); } catch { }
                const rows = await fsClient.listTagsBySession(token, selectedItem.path);
                const ids = (rows || []).map(r => Array.isArray(r) ? r[1] : (r.tag ?? r[1]));
                if (!mounted) return;
                setItemTagsMap(prev => ({ ...prev, [normalizeFrontendPath(selectedItem.path)]: ids }));
            } catch (err) {
                console.error('list tags failed', err);
                // leave itemTagsMap unchanged (fallback to previous state or "No tags")
            }
        }
        loadTags();
        return () => { mounted = false; };
    }, [selectedItem]);

    // ---------------------------
    // Navigation handlers
    // ---------------------------
    function normalizeDirPath(path) {
        if (!path) return path;
        if (path.endsWith('/') || path.endsWith('\\')) return path;
        if (path.includes('/')) return path + '/';
        if (path.includes('\\')) return path + '\\';
        return path + '/';
    }

    async function navigateTo(path) {
        if (!path) return;
        setSelectedItem(null);
        setActiveTagId(null);
        setSearchMode(false);
        setViewTab('folder');
        setGlobalSearchResults([]);

        const norm = normalizeDirPath(path);

        setHistory((prev) => {
            const sliced = prev.slice(0, historyIndex + 1);
            const next = [...sliced, norm];
            // setHistoryIndex should be derived from previous state length; update after state update
            setTimeout(() => setHistoryIndex(next.length - 1), 0);
            return next;
        });


        setCurrentPath(norm);
    }

    async function handleOpen(item) {
        if (!item) return;

        if (item.isDir) {
            setViewTab('folder');
            setSearchMode(false);
            setGlobalSearchResults([]);

            try {
                const token = await sessionClient.getSessionToken();
                if (!token) { navigateTo(item.path); return; }

                try {
                    await fsClient.listDir(token, item.path);
                    navigateTo(item.path);
                    return;
                } catch (e1) {
                    const tryPaths = [item.path + '/', item.path + '\\'];
                    for (const tp of tryPaths) {
                        try {
                            await fsClient.listDir(token, tp);
                            navigateTo(tp);
                            return;
                        } catch (e2) {
                            // continue
                        }
                    }
                    navigateTo(item.path);
                    return;
                }
            } catch (err) {
                console.error('[FileExplorer] verify dir failed:', err);
                navigateTo(item.path);
                return;
            }
        }

        // for files: prefer backend open_file_by_session (audited + system opener)
        setSelectedItem(item);
        try {
            // attempt to get a session token (may be null)
            let token = null;
            try { token = await sessionClient.getSessionToken(); } catch (e) { /* ignore */ }

            // Prefer backend open (audited). openFileBySession will fall back to plugin-shell if backend not available.
            await fsClient.openFileBySession(token, item.path);
            return;
        } catch (err) {
            console.error('[FileExplorer] open file failed (backend + fallback):', err);

            // final fallback: try plugin-shell directly (openWithSystemApp). This should launch the default app.
            try {
                await fsClient.openWithSystemApp(item.path);
            } catch (err2) {
                console.error('[FileExplorer] open with system app failed:', err2);
                alert('Failed to open file: ' + String(err2));
            }
        }
    }

    function handleBack() {
        if (!canGoBack) return;
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        const path = history[newIndex];
        setCurrentPath(path);
        setSelectedItem(null);
        setActiveTagId(null);
        setSearchMode(false);
        setViewTab('folder');
    }

    function handleForward() {
        if (!canGoForward) return;
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        const path = history[newIndex];
        setCurrentPath(path);
        setSelectedItem(null);
        setActiveTagId(null);
        setSearchMode(false);
        setViewTab('folder');
    }

    function handleBreadcrumbClick(idx) {
        if (!currentPath) return;
        const segments = pathSegments.slice(0, idx + 1);
        let sep = '\\';
        if (currentPath.includes('/')) sep = '/';
        const newPath = segments.join(sep) + sep;
        navigateTo(newPath);
    }

    // ---------------------------
    // Search: Global / Folder
    // ---------------------------
    async function handleSubmitSearch(e) {
        e && e.preventDefault();
        if (!query.trim()) {
            setSearchMode(false);
            setGlobalSearchResults([]);
            setViewTab('folder');
            return;
        }

        setSearchMode(true);
        setActiveTagId(null);
        setSelectedItem(null);
        setGlobalSearchLoading(true);

        const token = await sessionClient.getSessionToken().catch(() => null);

        try {
            const results = await fsClient.searchFiles(token || null, query.trim(), 1000, 0);
            const mapped = (results || []).map((r) => ({
                name: r.name,
                isDir: !!r.is_dir,
                size: r.size == null ? null : r.size,
                modified: r.modified ? new Date(r.modified * 1000).toISOString().replace('T', ' ').slice(0, 19) : null,
                path: r.path,
                raw: r,
            })).filter(it => it.path);
            setGlobalSearchResults(mapped);
            setViewTab('global');
        } catch (err) {
            console.error('[FileExplorer] global search failed:', err);
            setGlobalSearchResults([]);
        } finally {
            setGlobalSearchLoading(false);
        }
    }

    async function handleTagClick(tagId) {
        console.log("FileExplorer ------ line 444 ------- " + tagId);
        if (activeTagId === tagId) {
            setActiveTagId(null);
            setGlobalSearchResults([]);
            setViewTab('folder');
            setSelectedItem(null);
            return;
        }

        setActiveTagId(tagId);
        setSelectedItem(null);

        if (tagId === 'recent') {
            setSearchMode(false);
            setViewTab('folder');
            return;
        }

        setGlobalSearchLoading(true);
        setViewTab('global');
        setSearchMode(true);
        try {
            let token = null;
            try { token = await sessionClient.getSessionToken(); } catch (e) { /* ignore */ }
            console.log("FileExplorer ------ line 468 ------- " + tagId);
            const results = await fsClient.searchFilesByTag(token, tagId, 100, 0);

            const mapped = (results || []).map((r) => {
                const basename = (r.path || '').split(/[\\/]/).pop() || r.path || '';
                return {
                    name: r.name || basename,
                    isDir: !!r.is_dir,
                    size: r.size == null ? null : r.size,
                    modified: r.modified ? new Date(r.modified * 1000).toISOString().replace('T', ' ').slice(0, 19) : null,
                    path: r.path,
                    normPath: normalizeFrontendPath(r.path),
                };
            });

            setGlobalSearchResults(mapped);
        } catch (err) {
            console.error('[FileExplorer] tag search failed:', err);
            setGlobalSearchResults([]);
        } finally {
            setGlobalSearchLoading(false);
        }
    }

    function clearSearch() {
        setQuery('');
        setSearchMode(false);
        setGlobalSearchResults([]);
        setViewTab('folder');
    }

    // Tag CRUD & Admin file ops...
    // (kept as in your original — unchanged for brevity)
    async function addTagToItem(tagId) {
        if (!selectedItem) return;
        const token = await sessionClient.getSessionToken();
        if (!token) return alert('Operation requires login (admin).');

        try {
            await fsClient.tagItemBySession(token, selectedItem.path, tagId);
            console.log(selectedItem.path);
            // fetch authoritative tags and update UI
            const rows = await fsClient.listTagsBySession(token, selectedItem.path);
            const ids = (rows || []).map(r => Array.isArray(r) ? r[1] : (r.tag ?? r[1]));
            setItemTagsMap(prev => ({ ...prev, [normalizeFrontendPath(selectedItem.path)]: ids }));
        } catch (err) {
            alert('Failed to add tag: ' + String(err));
        }
    }

    async function removeTagFromItem(tagId) {
        if (!selectedItem) return;
        const canonicalKey = normalizeFrontendPath(selectedItem.path);
        console.log(canonicalKey);
        // mark loading for this tag
        setTagOpLoading(prev => ({ ...prev, [tagId]: true }));

        let token;
        try {
            token = await sessionClient.getSessionToken();
        } catch (e) {
            token = null;
        }
        if (!token) {
            setTagOpLoading(prev => ({ ...prev, [tagId]: false }));
            return alert('Operation requires login (admin).');
        }

        try {
            // Call backend to remove the tag
            await fsClient.untagItemBySession(token, canonicalKey, tagId);

            // After successful remove, fetch authoritative tag list for the path
            const rows = await fsClient.listTagsBySession(token, canonicalKey);
            const ids = (rows || []).map(r => Array.isArray(r) ? r[1] : (r.tag ?? r[1]));
            const uniqueIds = Array.from(new Set(ids || []));

            // Update itemTagsMap authoritative state
            setItemTagsMap(prev => ({ ...prev, [canonicalKey]: uniqueIds }));

            // Also update any lists that may show tag badges (folderItems and globalSearchResults)
            setFolderItems(prev => prev.map(it => {
                if (normalizeFrontendPath(it.path) !== canonicalKey) return it;
                return { ...it }; // no change required for item content, tags come from itemTagsMap
            }));

            setGlobalSearchResults(prev => prev.map(it => {
                if (normalizeFrontendPath(it.path) !== canonicalKey) return it;
                return { ...it };
            }));
        } catch (err) {
            // show room for debugging - surface the error to console and user
            console.error('[FileExplorer] removeTag failed:', err);
            alert('Failed to remove tag: ' + (err?.message || String(err)));
        } finally {
            setTagOpLoading(prev => ({ ...prev, [tagId]: false }));
        }
    }

    async function renameItem() {
        if (!selectedItem) return;
        const newName = prompt('New name (basename only):', selectedItem.name);
        if (!newName) return;

        // derive destination path
        const sep = selectedItem.path.includes('\\') ? '\\' : '/';
        const parts = selectedItem.path.split(/[\\/]/);
        const dest = parts.slice(0, parts.length - 1).concat(newName).join(sep);

        let token = null;
        try { token = await sessionClient.getSessionToken(); } catch (e) { /* ignore */ }
        if (!token) return alert('Operation requires login (admin).');

        try {
            await fsClient.renameItemBySession(token, selectedItem.path, dest);

            // Optimistically update UI: folderItems & globalSearchResults & selectedItem
            setFolderItems(prev => prev.map(i => i.path === selectedItem.path ? { ...i, name: newName, path: dest, normPath: normalizeFrontendPath(dest) } : i));
            setGlobalSearchResults(prev => prev.map(i => i.path === selectedItem.path ? { ...i, name: newName, path: dest, normPath: normalizeFrontendPath(dest) } : i));
            setSelectedItem(prev => prev ? { ...prev, name: newName, path: dest, normPath: normalizeFrontendPath(dest) } : prev);

            // Optionally refresh the current folder listing to be authoritative
            try {
                const fresh = await fsClient.listDir(token, currentPath);
                setFolderItems((fresh || []).map((it) => ({
                    name: it.name,
                    isDir: !!it.is_dir,
                    size: it.size == null ? null : it.size,
                    modified: it.modified ? new Date(it.modified * 1000).toISOString().replace('T', ' ').slice(0, 19) : null,
                    path: it.path,
                    normPath: normalizeFrontendPath(it.path),
                })));
            } catch (e) {
                // ignore refresh failure (we already updated UI optimistically)
                console.warn('[FileExplorer] refresh after rename failed:', e);
            }
        } catch (err) {
            console.error('rename failed', err);
            alert('Rename failed: ' + String(err));
        }
    }

    // Note: `dialog.open` is the canonical Tauri API, but it may be unavailable depending on allowlist.
    // improved pickDirectory helper
    // pickDirectory: choose destination directory (directory picker)
    // async function pickDirectory(promptMessage = 'Select destination folder') {
    //     // try Tauri dialog first
    //     try {
    //         // options: directory: true to choose folder only
    //         const selected = await tauriDialogOpen({
    //             directory: true,
    //             multiple: false,
    //             title: promptMessage,
    //         });
    //         // selected will be null if cancelled, or string path if chosen
    //         if (!selected) {
    //             console.log('destination selection cancelled');
    //             return null;
    //         }
    //         // If dialog returns an array (depends on platform/options), pick first
    //         if (Array.isArray(selected)) return selected[0] || null;
    //         return selected;
    //     } catch (err) {
    //         console.warn('Tauri dialog not available or failed:', err);
    //         // fallback: prompt user to paste a destination path (last resort)
    //         const fallback = window.prompt('Choose destination folder (paste full path):');
    //         if (!fallback) {
    //             console.log('destination selection cancelled (fallback)');
    //             return null;
    //         }
    //         return String(fallback);
    //     }
    // }

    // action: 'move' or 'copy' ; srcPath = full source path; srcIsDir boolean
    // ensure you have path utilities available. If you don't have path-browserify, you can compute basename with this small helper:
    function basename(p) {
        if (!p) return p;
        // normalize slashes for extraction
        const s = String(p).replace(/\\/g, '/').replace(/\/+$/, '');
        const idx = s.lastIndexOf('/');
        return idx === -1 ? s : s.slice(idx + 1);
    }

    function joinPath(a, b) {
        if (!a) return b;
        const A = String(a).replace(/[\\/]+$/, '');
        const B = String(b).replace(/^[\\/]+/, '');
        // Use backslashes on Windows if A contains backslash; otherwise use forward
        const sep = A.includes('\\') ? '\\' : '/';
        return `${A}${sep}${B}`;
    }

    // action: 'move' or 'copy', srcPath is absolute path string, srcIsDir boolean
    // normalize error helper (reuse from fsClient or copy small one)
    function normalizeErrorLocal(err) {
        if (!err) return 'Unknown error';
        if (err?.message) return err.message;
        if (typeof err === 'string') return err;
        try { return JSON.stringify(err); } catch { return String(err); }
    }

    // Helper: try several common places for the sessionToken and selected paths
    // ----------------- Replace resolveSessionTokenMaybe -----------------
    async function resolveSessionTokenMaybe() {
        // Don't attempt to read out-of-scope variables; always query sessionClient
        try {
            const t = await sessionClient.getSessionToken();
            return t || null;
        } catch (e) {
            console.warn('resolveSessionTokenMaybe: sessionClient failed', e);
            return null;
        }
    }

    // ----------------- Replace resolveSelectedPathsFallback -----------------
    function resolveSelectedPathsFallback(pathsArg) {
        // If caller passed explicit arg, prefer it
        if (Array.isArray(pathsArg) && pathsArg.length) return pathsArg.slice();

        // Prefer the component-level selectedItem (single selection)
        try {
            if (selectedItem && selectedItem.path) return [selectedItem.path];
        } catch (e) { /* ignore */ }

        // Try window-global fallback (useful while wiring multi-select)
        try {
            if (window && Array.isArray(window.__selectedPaths) && window.__selectedPaths.length) {
                return window.__selectedPaths.slice();
            }
        } catch (e) { /* ignore */ }

        // No selection
        return [];
    }

    // ----------------- Replace pickDirectory implementation -----------------
    // improved pickDirectory helper (uses openDialog imported as openDialog)
    // improved pickDirectory helper: tries plugin APIs then falls back to interactive prompt-driven chooser
    async function pickDirectory(promptMessage = 'Select destination folder') {
        // Helper: small absolute-path checker
        function looksAbsolute(p) {
            if (!p) return false;
            const s = String(p);
            // Windows drive-letter or UNC
            if (/^[A-Za-z]:[\\/]/.test(s) || s.startsWith('\\\\')) return true;
            // POSIX
            if (s.startsWith('/')) return true;
            return false;
        }

        // 1) Try plugin-dialog if available (two common import styles)
        try {
            // try the imported openDialog (you had `import { open as openDialog } from '@tauri-apps/plugin-dialog';`)
            if (typeof openDialog === 'function') {
                const res = await openDialog({ directory: true, multiple: false, title: promptMessage });
                if (res) {
                    const picked = Array.isArray(res) ? res[0] : res;
                    let cand = String(picked);
                    if (cand.startsWith('\\\\?\\')) cand = cand.slice(4);
                    if (looksAbsolute(cand)) return cand;
                    // If plugin returned something weird, keep falling back
                }
            }
        } catch (e) {
            console.debug('openDialog/plugin-dialog not available or failed:', e);
        }

        // 2) Try the newer API package dynamically: @tauri-apps/api/dialog (some apps use this)
        try {
            // dynamic import so code won't crash if package missing
            // eslint-disable-next-line no-undef
            const mod = await import('@tauri-apps/plugin-dialog').catch(() => null);
            if (mod && typeof mod.open === 'function') {
                const res = await mod.open({ directory: true, multiple: false, title: promptMessage });
                if (res) {
                    const picked = Array.isArray(res) ? res[0] : res;
                    let cand = String(picked);
                    if (cand.startsWith('\\\\?\\')) cand = cand.slice(4);
                    if (looksAbsolute(cand)) return cand;
                }
            }
        } catch (e) {
            console.debug('@tauri-apps/api/dialog not available or failed:', e);
        }

        // 3) Try browser-native directory picker (rare in desktop apps)
        try {
            if (window && typeof window.showDirectoryPicker === 'function') {
                try {
                    const handle = await window.showDirectoryPicker();
                    // Not all browsers expose a full path; ask user to confirm / paste if missing
                    if (handle) {
                        // best-effort: some environments provide .name but not path. Ask user to paste full path.
                        const maybe = window.prompt('Directory picked. Paste full absolute path for that directory (or Cancel):', handle.name || '');
                        if (maybe && looksAbsolute(maybe)) return maybe;
                    }
                } catch (e) {
                    // user's environment might deny permission or it isn't supported
                }
            }
        } catch (e) {
            // ignore
        }

        // 4) FALLBACK: interactive chooser using backend listing (no plugin dependency).
        // This will let user choose a drive, then drill down directories with numbered choices.
        try {
            let token = null;
            try { token = await sessionClient.getSessionToken(); } catch (e) { token = null; }

            // Get drives (if available)
            let drives = [];
            try {
                drives = await fsClient.listDrives(token).catch(() => []);
            } catch (e) {
                drives = [];
            }

            // If we have no drives info, ask user to paste an absolute path directly
            if (!drives || drives.length === 0) {
                const pasted = window.prompt(`${promptMessage}\n\nNo drives available via backend. Paste the absolute destination folder path:`);
                if (!pasted) return null;
                if (!looksAbsolute(pasted)) {
                    alert('That does not look like an absolute path. Try again.');
                    return null;
                }
                return pasted;
            }

            // interactive navigation helpers
            async function listDirsAt(p) {
                try {
                    const tokenLocal = token;
                    const entries = await fsClient.listDir(tokenLocal, p).catch(() => []);
                    // Return only directories and normalize path
                    return (entries || []).filter(it => it.isDir).map(it => ({ name: it.name, path: it.path }));
                } catch (e) {
                    return [];
                }
            }

            // Step 1: choose a drive or paste path
            const driveChoices = drives.map((d, i) => `${i + 1}) ${d.mount_point || d.id || d.label || d.drive}`);
            driveChoices.push('P) Paste an absolute path');
            driveChoices.push('C) Cancel');

            let selectedPath = null;
            let choice = window.prompt(`${promptMessage}\n\nChoose a drive by number or paste path:\n\n${driveChoices.join('\n')}\n\nEnter number, 'P' or 'C' (Cancel):`);
            if (!choice) return null;
            choice = String(choice).trim();

            if (/^p$/i.test(choice)) {
                const pasted = window.prompt('Paste an absolute folder path (e.g. C:\\\\Users\\\\You\\\\Documents or /home/you/Documents):');
                if (!pasted) return null;
                if (!looksAbsolute(pasted)) {
                    alert('Not an absolute path. Cancelled.');
                    return null;
                }
                selectedPath = pasted;
                return selectedPath;
            }
            if (/^c$/i.test(choice)) return null;

            const idx = parseInt(choice, 10);
            if (Number.isFinite(idx) && idx >= 1 && idx <= drives.length) {
                selectedPath = drives[idx - 1].mount_point || drives[idx - 1].id || drives[idx - 1].label;
            } else {
                // if user typed an absolute path directly
                if (looksAbsolute(choice)) {
                    selectedPath = choice;
                } else {
                    alert('Invalid selection. Cancelled.');
                    return null;
                }
            }

            // Now drill down interactively until user confirms this folder
            while (true) {
                // normalize long path prefix for readability
                let displayPath = String(selectedPath);
                if (displayPath.startsWith('\\\\?\\')) displayPath = displayPath.slice(4);

                // show current and ask what to do
                const confirmMsg = `Current: ${displayPath}\n\nOptions:\n - OK => choose this folder\n - L => list subfolders (to enter)\n - U => go up one level\n - P => paste an absolute path instead\n - C => cancel`;
                const action = window.prompt(confirmMsg + `\n\nEnter OK / L / U / P / C:`);

                if (!action) return null;
                const a = String(action).trim().toLowerCase();

                if (a === 'ok' || a === 'o') {
                    // final sanity: ensure absolute
                    if (!looksAbsolute(selectedPath)) {
                        alert('Selected path is not absolute. Cancelled.');
                        return null;
                    }
                    return selectedPath;
                }

                if (a === 'c') return null;
                if (a === 'p') {
                    const pasted = window.prompt('Paste an absolute folder path:');
                    if (!pasted) return null;
                    if (!looksAbsolute(pasted)) {
                        alert('Not an absolute path. Cancelled.');
                        return null;
                    }
                    selectedPath = pasted;
                    continue;
                }

                if (a === 'u') {
                    // go up one level
                    // simple parent calculation
                    let s = String(selectedPath).replace(/[\\/]+$/, '');
                    const sepIdx = Math.max(s.lastIndexOf('\\'), s.lastIndexOf('/'));
                    if (sepIdx > 0) {
                        selectedPath = s.slice(0, sepIdx);
                    } else {
                        alert('Cannot go up further.');
                    }
                    continue;
                }

                if (a === 'l') {
                    // list subdirectories
                    const subs = await listDirsAt(selectedPath);
                    if (!subs || subs.length === 0) {
                        alert('No subfolders visible (or permission denied). You can paste path or choose OK to pick the current folder.');
                        continue;
                    }
                    // Build numbered list
                    const lines = subs.slice(0, 200).map((s, i) => `${i + 1}) ${s.name}`);
                    lines.push('B) Back / Cancel listing');
                    const pick = window.prompt(`Subfolders of ${displayPath}:\n\n${lines.join('\n')}\n\nEnter number to enter that folder or B to go back:`);
                    if (!pick) continue;
                    if (/^b$/i.test(pick)) continue;
                    const pickIdx = parseInt(pick, 10);
                    if (Number.isFinite(pickIdx) && pickIdx >= 1 && pickIdx <= subs.length) {
                        selectedPath = subs[pickIdx - 1].path;
                        continue;
                    } else {
                        alert('Invalid choice.');
                        continue;
                    }
                }

                alert('Unknown option. Enter OK, L, U, P, or C.');
            }
        } catch (err) {
            console.error('pickDirectory fallback failed:', err);
            const fallback = window.prompt(`${promptMessage}\n\nFallback: paste absolute folder path:`);
            if (!fallback) return null;
            return fallback;
        }
    }

    // ----------------- Replace deleteItem -----------------
    async function deleteItem(pathArg = null) {
        try {
            const sessionTok = await resolveSessionTokenMaybe();
            if (!sessionTok) {
                alert('No session token available — please login again.');
                return;
            }

            // Determine path(s)
            let pathsToDelete = [];
            if (pathArg) pathsToDelete = [pathArg];
            else pathsToDelete = resolveSelectedPathsFallback();

            if (!pathsToDelete || pathsToDelete.length === 0) {
                alert('No item selected to delete.');
                return;
            }

            const ok = confirm(`Delete ${pathsToDelete.length} item(s)? This cannot be undone.`);
            if (!ok) return;

            const results = [];
            for (const p of pathsToDelete) {
                try {
                    await fsClient.deleteItemBySession(sessionTok, p);
                    results.push({ path: p, ok: true });
                } catch (err) {
                    console.error('delete failed for', p, err);
                    results.push({ path: p, ok: false, error: err?.message || String(err) });
                }
            }

            // Refresh listing (safe no-op if these helpers don't exist)
            try { if (typeof reloadCurrentDir === 'function') reloadCurrentDir(); } catch { }
            try { if (typeof refreshListing === 'function') refreshListing(); } catch { }

            const failed = results.filter(r => !r.ok);
            if (failed.length === 0) {
                alert(`Deleted ${results.length} item(s).`);
            } else {
                alert(`Delete completed with ${failed.length} failure(s). See console for details.`);
            }
            return results;
        } catch (e) {
            console.error('deleteItem error', e);
            alert('Unexpected error: ' + (e?.message || String(e)));
        }
    }

    // ----------------- Replace moveOrCopyItem -----------------
    async function moveOrCopyItem(action = 'move', pathsArg = null) {
        try {
            if (action !== 'move' && action !== 'copy') throw new Error('invalid action');

            const sessionTok = await resolveSessionTokenMaybe();
            if (!sessionTok) {
                alert('No session token available — please login again.');
                return;
            }

            // Determine source items
            const selected = resolveSelectedPathsFallback(pathsArg);
            if (!selected || selected.length === 0) {
                alert('No item selected to move/copy.');
                return;
            }

            // ask user for destination folder
            const destDir = await pickDirectory(`Select destination folder to ${action}`);
            if (!destDir) {
                console.log('destination selection cancelled');
                return;
            }

            const results = [];
            for (const src of selected) {
                const base = String(src).split(/[/\\]/).pop();
                const dst = joinPath(destDir, base);

                try {
                    if (action === 'move') {
                        await fsClient.moveItemBySession(sessionTok, src, dst);
                    } else {
                        await fsClient.copyItemBySession(sessionTok, src, dst);
                    }
                    results.push({ src, dst, ok: true });
                } catch (err) {
                    console.error(`${action} failed for ${src} -> ${dst}`, err);
                    results.push({ src, dst, ok: false, error: err?.message || String(err) });
                }
            }

            // Refresh listing
            try { if (typeof reloadCurrentDir === 'function') reloadCurrentDir(); } catch { }
            try { if (typeof refreshListing === 'function') refreshListing(); } catch { }

            const failed = results.filter(r => !r.ok);
            if (failed.length === 0) {
                alert(`${action.charAt(0).toUpperCase() + action.slice(1)} succeeded for ${results.length} item(s).`);
            } else {
                alert(`${action} completed with ${failed.length} failed. Check console for details.`);
            }
            return results;
        } catch (e) {
            console.error('moveOrCopyItem error', e);
            alert('Unexpected error: ' + (e?.message || String(e)));
            return;
        }
    }
    // ---------------------------
    // Render
    // ---------------------------
    return (
        <div className="relative min-h-screen overflow-hidden">
            <img
                src={bgImage2}
                alt="PRABAL background"
                className="fixed inset-0 -z-20 h-full w-full object-cover blur-lg brightness-75 saturate-150"
            />
            <div
                className="fixed inset-0 -z-10 backdrop-blur-xl opacity-90 dark:opacity-60"
                style={{
                    background:
                        'radial-gradient(circle at top, rgba(148,163,253,0.22), transparent 80%), linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                }}
            />
            <div className="pointer-events-none fixed inset-0 -z-10 hidden bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.85),_transparent_70%)] dark:block" />

            <div className="relative z-10 px-4 py-4 text-slate-900 md:px-10 md:py-6 dark:text-[var(--soft-white,_#e5e7eb)]">
                {/* Top bar */}
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            PRABAL
                        </p>
                        <h1 className="text-xl font-semibold text-slate-900 md:text-2xl dark:text-slate-50">
                            File Explorer
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Browse folders or run a global indexed search (requires indexing). Admin-only changes via Dashboard.
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmitSearch}
                        className="flex w-full max-w-xl items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-2 py-1.5 shadow-sm shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/90 dark:shadow-black/40"
                    >
                        <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search this folder or click Search to run a global indexed search"
                            className="flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400 dark:text-slate-100"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="px-2 text-[0.7rem] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            type="submit"
                            className="inline-flex items-center rounded-xl bg-sky-600 px-2.5 py-1 text-[0.7rem] font-semibold text-white hover:bg-sky-500 dark:bg-sky-500 dark:text-slate-950"
                        >
                            Search
                        </button>
                    </form>
                </div>

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,2.4fr)_minmax(0,1.4fr)]">
                    {/* LEFT: Drives + Tags */}
                    <div className="flex flex-col gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-white/85 p-3 text-xs shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/80 dark:shadow-black/40">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-[0.75rem] font-semibold text-sky-700 dark:text-sky-300">
                                    Drives
                                </p>
                            </div>
                            <ul className="space-y-1 text-[0.8rem]">
                                {drivesLoading ? (
                                    <li className="text-sm text-slate-500">Loading drives…</li>
                                ) : drives.length === 0 ? (
                                    <li className="text-sm text-slate-500">No drives found or not authorized.</li>
                                ) : (
                                    drives.map((drive) => {
                                        const active = currentPath && currentPath.startsWith(drive.mount_point || drive.id);
                                        const label = drive.label || drive.mount_point || drive.id || drive.drive;
                                        const id = drive.mount_point || drive.id || drive.drive || label;
                                        return (
                                            <li key={id}>
                                                <button
                                                    type="button"
                                                    onClick={() => navigateTo(id)}
                                                    className={[
                                                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition',
                                                        active
                                                            ? 'bg-sky-50 text-sky-800 dark:bg-sky-500/15 dark:text-sky-100'
                                                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/80',
                                                    ].join(' ')}
                                                >
                                                    <HardDrive className="h-3.5 w-3.5" />
                                                    <span className="truncate">{label}</span>
                                                </button>
                                            </li>
                                        );
                                    })
                                )}
                            </ul>
                        </div>

                        {/* Tags */}
                        <div className="rounded-2xl border border-slate-200 bg-white/85 p-3 text-xs shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/80 dark:shadow-black/40">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-[0.75rem] font-semibold text-sky-700 dark:text-sky-300">
                                    Tags
                                </p>
                                <span className="text-[0.65rem] text-slate-500 dark:text-slate-400">
                                    Star · IMP · Conf
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {SYSTEM_TAGS.map((tag) => {
                                    const active = activeTagId === tag.id;
                                    return (
                                        <button
                                            key={tag.id}
                                            type="button"
                                            onClick={() => handleTagClick(tag.id)}
                                            className={[
                                                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] transition',
                                                active
                                                    ? 'bg-sky-600 text-white dark:bg-sky-400 dark:text-slate-950'
                                                    : tag.color ||
                                                    'bg-slate-100 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200',
                                            ].join(' ')}
                                        >
                                            <Tag className="h-3 w-3" />
                                            <span>{tag.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="mt-2 text-[0.65rem] text-slate-500 dark:text-slate-400">
                                Star / IMP are admin-managed labels. “Recent” requires indexing.
                            </p>
                        </div>
                    </div>

                    {/* CENTER: Toolbar + list */}
                    <div className="rounded-2xl border border-slate-200 bg-white/85 p-3 text-xs shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/80 dark:shadow-black/40">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    disabled={!canGoBack}
                                    className={[
                                        'inline-flex items-center justify-center rounded-md border px-1.5 py-1 text-[0.7rem]',
                                        canGoBack
                                            ? 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800/80'
                                            : 'border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-600',
                                    ].join(' ')}
                                >
                                    <ChevronLeft className="h-3 w-3" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleForward}
                                    disabled={!canGoForward}
                                    className={[
                                        'inline-flex items-center justify-center rounded-md border px-1.5 py-1 text-[0.7rem]',
                                        canGoForward
                                            ? 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800/80'
                                            : 'border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-600',
                                    ].join(' ')}
                                >
                                    <ChevronRight className="h-3 w-3" />
                                </button>
                            </div>

                            {/* Breadcrumb */}
                            <div className="flex min-w-0 flex-1 items-center gap-1 rounded-md border border-slate-200 bg-slate-50/60 px-2 py-1.5 text-[0.7rem] dark:border-slate-700 dark:bg-slate-900/70">
                                <span className="text-slate-400 dark:text-slate-500">Path:</span>
                                <div className="flex min-w-0 flex-wrap items-center gap-1">
                                    {pathSegments.length === 0 ? (
                                        <span className="truncate text-slate-600 dark:text-slate-300">{currentPath || '—'}</span>
                                    ) : (
                                        pathSegments.map((seg, idx) => (
                                            <React.Fragment key={`${seg}-${idx}`}>
                                                {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-400" />}
                                                <button type="button" onClick={() => handleBreadcrumbClick(idx)} className="max-w-[140px] truncate text-slate-700 hover:underline dark:text-slate-200">
                                                    {seg}
                                                </button>
                                            </React.Fragment>
                                        ))
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={async () => {
                                    const token = await sessionClient.getSessionToken();
                                    const rootToIndex = currentPath || drives[0]?.mount_point || drives[0]?.id;
                                    const jobId = await fsClient.indexPathStart(token, rootToIndex);
                                    const poll = setInterval(async () => {
                                        const status = await fsClient.getIndexStatus(jobId);
                                        console.log('index status', status);
                                        if (!status) { clearInterval(poll); return; }
                                        if (status.Running === undefined && status.Finished) { clearInterval(poll); }
                                    }, 1500);
                                }}
                            >
                                Index this folder (Admin)
                            </button>

                            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[0.65rem] text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900/80 dark:text-slate-400 dark:ring-slate-700">
                                {folderLoading ? 'Loading…' : listContextLabel}
                                {viewTab === 'global' && (
                                    <div className="text-xs text-slate-500">
                                        {console.log("globalSearchResults --------- " + globalSearchResults)}
                                        Global search: "{query}" · {globalSearchLoading ? 'Searching…' : `${globalSearchResults.length} results`}
                                    </div>
                                )}
                            </span>
                        </div>

                        {/* Header row */}
                        <div className="mb-1 grid grid-cols-[minmax(0,2.8fr)_minmax(0,1.1fr)_minmax(0,1fr)] gap-2 border-b border-slate-200 pb-1 text-[0.65rem] font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                            <span>Name</span>
                            <span>Type</span>
                            <span className="text-right">Size</span>
                        </div>

                        {/* List */}
                        <div className="max-h-[60vh] overflow-auto">
                            {folderLoading && viewTab === 'folder' ? (
                                <div className="py-6 text-center text-[0.8rem] text-slate-500 dark:text-slate-400">Loading folder…</div>
                            ) : listItems.length === 0 ? (
                                <div className="py-6 text-center text-[0.8rem] text-slate-500 dark:text-slate-400">
                                    {viewTab === 'global' ? (globalSearchLoading ? 'Searching…' : 'No global results.') : 'No items to show in this folder.'}
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-100 text-[0.8rem] dark:divide-slate-800/80">
                                    {listItems.map((item) => {
                                        const isSelected =
                                            selectedItem &&
                                            normalizeFrontendPath(selectedItem.path) === (item.normPath || normalizeFrontendPath(item.path));
                                        const ext = item.isDir ? 'Folder' : (item.name.includes('.') ? item.name.split('.').pop().toUpperCase() : 'File');

                                        return (
                                            <li key={item.path}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        // keep a debug/global fallback selection for older helpers
                                                        try { window.__selectedPaths = [item.path]; } catch (e) { /* ignore */ }
                                                    }}
                                                    onDoubleClick={() => handleOpen(item)}
                                                    className={[
                                                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition',
                                                        isSelected ? 'bg-sky-50 text-sky-900 dark:bg-sky-500/15 dark:text-sky-50' : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/70',
                                                    ].join(' ')}
                                                >
                                                    <div className="grid flex-1 grid-cols-[minmax(0,2.8fr)_minmax(0,1.1fr)_minmax(0,1fr)] items-center gap-2">
                                                        <div className="flex items-center gap-2">
                                                            {item.isDir ? <Folder className="h-4 w-4 text-amber-500" /> : <FileIcon className="h-4 w-4 text-slate-400" />}
                                                            <span className="truncate">{item.name}</span>
                                                        </div>
                                                        <div className="truncate text-[0.75rem] text-slate-500 dark:text-slate-400">{ext}</div>
                                                        <div className="text-right text-[0.75rem] text-slate-500 dark:text-slate-400">{item.isDir ? '—' : formatSize(item.size)}</div>
                                                    </div>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {/* Bottom tab */}
                        <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setViewTab('folder'); setSelectedItem(null); }}
                                    className={['px-2 py-1 rounded-md', viewTab === 'folder' ? 'bg-slate-100 dark:bg-slate-800/70' : 'hover:bg-slate-50 dark:hover:bg-slate-900/60'].join(' ')}
                                >
                                    This folder ({folderItems.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setViewTab('global'); setSelectedItem(null); }}
                                    className={['px-2 py-1 rounded-md', viewTab === 'global' ? 'bg-slate-100 dark:bg-slate-800/70' : 'hover:bg-slate-50 dark:hover:bg-slate-900/60'].join(' ')}
                                >
                                    Global results ({globalSearchResults.length})
                                </button>
                            </div>

                            <div className="text-[0.75rem] text-slate-400">
                                {viewTab === 'global' ? (globalSearchLoading ? 'Searching…' : `${globalSearchResults.length} results`) : `${folderItems.length} items`}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Details panel */}
                    <div className="rounded-2xl border border-slate-200 bg-white/85 p-3 text-xs shadow-md shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/80 dark:shadow-black/40">
                        <p className="mb-2 text-[0.75rem] font-semibold text-sky-700 dark:text-sky-300">Details & Tags</p>
                        {!selectedItem ? (
                            <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">Select a file or folder to view details. All edits/deletes are admin-only via Dashboard.</p>
                        ) : (
                            <>
                                <div className="mb-3 space-y-1 text-[0.75rem]">
                                    <p className="font-medium text-slate-900 dark:text-slate-50">{selectedItem.name}</p>
                                    <p className="text-slate-500 dark:text-slate-400">{selectedItem.isDir ? 'Folder' : 'File'} · {selectedItem.isDir ? '—' : formatSize(selectedItem.size)}</p>
                                    <p className="break-all text-slate-500 dark:text-slate-400">{selectedItem.path}</p>
                                    {selectedItem.modified && <p className="text-slate-500 dark:text-slate-400">Modified: {selectedItem.modified}</p>}
                                </div>

                                <div className="border-t border-slate-200 pt-2 dark:border-slate-700">
                                    <p className="mb-1 text-[0.7rem] font-semibold text-slate-600 dark:text-slate-300">Tags</p>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {getTagsForPath(selectedItem.path, itemTagsMap).length === 0 ? (
                                            <span className="text-[0.7rem] text-slate-500 dark:text-slate-400">No tags yet.</span>
                                        ) : (
                                            getTagsForPath(selectedItem.path, itemTagsMap).map((tag) => {
                                                const loading = !!tagOpLoading[tag.id];
                                                return (
                                                    <span key={tag.id} className={['inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-[0.7rem]', tag.color || 'bg-slate-100 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200'].join(' ')}>
                                                        <Tag className="h-3 w-3" />
                                                        <span>{tag.name}</span>
                                                        <button
                                                            type="button"                     // <-- important
                                                            onClick={() => removeTagFromItem(tag.id)}
                                                            disabled={loading}
                                                            className="ml-1 text-[0.65rem] text-slate-400 hover:text-slate-600 disabled:opacity-50"
                                                            title="Remove tag"
                                                        >
                                                            ✕
                                                        </button>
                                                    </span>
                                                );
                                            })
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <select id="tag-select" className="rounded px-2 py-1 text-xs">
                                            {SYSTEM_TAGS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                        <button
                                            onClick={() => {
                                                const sel = document.getElementById('tag-select');
                                                if (!sel) return;
                                                const tagId = sel.value;
                                                addTagToItem(tagId);
                                            }}
                                            className="rounded bg-sky-600 px-2 py-1 text-[0.75rem] text-white"
                                        >
                                            Add tag
                                        </button>
                                    </div>

                                    <div className="mt-3 border-t pt-3">
                                        <p className="mb-1 text-[0.7rem] font-semibold text-slate-600 dark:text-slate-300">Admin operations</p>
                                        <div className="flex flex-wrap gap-2">
                                            <button onClick={renameItem} className="rounded px-2 py-1 text-[0.75rem] bg-slate-100">Rename</button>
                                            {/* <button onClick={() => moveOrCopyItem('move')} className="rounded px-2 py-1 text-[0.75rem] bg-amber-100">Move</button>
                                            <button onClick={() => moveOrCopyItem('copy')} className="rounded px-2 py-1 text-[0.75rem] bg-emerald-100">Copy</button>
                                            <button onClick={() => deleteItem()} className="rounded px-2 py-1 text-[0.75rem] bg-red-100 text-red-700">Delete</button> */}
                                            <button onClick={() => { navigator.clipboard?.writeText(selectedItem.path); alert('Path copied'); }} className="rounded px-2 py-1 text-[0.75rem] bg-slate-100">Copy path</button>
                                        </div>
                                        <p className="mt-2 text-[0.65rem] text-slate-400">Admin file operations call backend commands like <span className="font-mono">fs_delete_by_session</span>, <span className="font-mono">fs_rename_by_session</span>, <span className="font-mono">fs_tag_item_by_session</span>. If your backend uses different names I attempt sensible fallbacks.</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
