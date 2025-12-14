/* eslint-disable no-console */
import { invoke } from '@tauri-apps/api/core';
import { open as tauriOpen } from "@tauri-apps/plugin-shell";
import sessionClient from './sessionClient';

function normalizeError(err) {
  if (!err) return 'Unknown error';
  if (err?.message) return err.message;
  if (typeof err === 'string') return err;
  try { return JSON.stringify(err); } catch { return String(err); }
}

async function tryCandidates(candidates, debugLabel) {
  let lastErr = null;
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    try {
      const res = await c();
      console.debug(`[fsClient] ${debugLabel} SUCCESS (candidate ${i})`, res);
      return res;
    } catch (e) {
      lastErr = e;
      try {
        console.warn(`[fsClient] ${debugLabel} candidate ${i} failed:`, e);
      } catch {
        // ignore any logging problem
      }
    }
  }
  throw new Error(`${debugLabel} failed: ${normalizeError(lastErr)}`);
}

export async function getFilesPerDrive(limit = 50) {
  try {
    return await tryCandidates([
      () => invoke('get_files_per_drive', { limit }),
      () => invoke('get_files_per_drive', { Limit: limit }),
      () => invoke('getFilesPerDrive', { limit }),
    ], 'getFilesPerDrive');
  } catch (e) { throw e; }
}

export async function getIndexingByDriveAndType(limit = 200) {
  return tryCandidates([
    () => invoke('get_indexing_by_drive_and_type', { limit }),
    () => invoke('get_indexing_by_drive_and_type', { Limit: limit }),
    () => invoke('getIndexingByDriveAndType', { limit }),
  ], 'getIndexingByDriveAndType');
}

export async function getIndexingSummaryGlobal() {
  return tryCandidates([
    () => invoke('get_indexing_summary_global'),
    () => invoke('getIndexingSummaryGlobal'),
  ], 'getIndexingSummaryGlobal');
}

export async function getStorageInfoWithScan() {
  return tryCandidates([
    () => invoke('get_storage_info_with_scan'),
    () => invoke('getStorageInfoWithScan'),
  ], 'getStorageInfoWithScan');
}

export async function listDrives(sessionToken) {
  if (!sessionToken && sessionClient && sessionClient.getSessionToken) {
    try {
      sessionToken = await sessionClient.getSessionToken();
    } catch {
      /* ignore - we'll still try unauthenticated fallback later */
    }
  }

  if (sessionToken) {
    const camel = { sessionToken: sessionToken };
    const snake = { session_token: sessionToken };
    return tryCandidates([
      () => invoke('list_drives', camel),
      () => invoke('list_drives', snake),
      () => invoke('listDrives', camel),
      () => invoke('listDrives', snake),
    ], 'listDrives');
  }

  return tryCandidates([
    () => invoke('list_drives'),
    () => invoke('listDrives'),
  ], 'listDrives');
}

function buildParamVariants(obj) {
  const snake = { ...obj };
  const camel = Object.keys(obj).reduce((acc, k) => {
    const parts = k.split('_');
    if (parts.length === 1) {
      acc[k] = obj[k];
    } else {
      const camelKey = parts
        .map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
        .join('');
      acc[camelKey] = obj[k];
    }
    return acc;
  }, {});
  return [snake, camel];
}

async function invokeWithParamVariants(cmdName, paramsObj) {
  const [snake, camel] = buildParamVariants(paramsObj);
  const candidates = [
    () => invoke(cmdName, snake),
    () => invoke(cmdName, camel),
  ];
  if (!paramsObj || Object.keys(paramsObj).length === 0) {
    candidates.push(() => invoke(cmdName));
  }
  return tryCandidates(candidates, cmdName);
}

function toCamelCaseObj(obj) {
  const out = {};
  for (const k of Object.keys(obj)) {
    const parts = k.split('_');
    if (parts.length === 1) {
      out[k] = obj[k];
    } else {
      const camel = parts.map((p, i) => (i === 0 ? p : p[0].toUpperCase() + p.slice(1))).join('');
      out[camel] = obj[k];
    }
  }
  return out;
}

async function invokeCamelThenSnake(cmdName, paramsObj) {
  const camel = toCamelCaseObj(paramsObj || {});
  const snake = { ...(paramsObj || {}) };
  const candidates = [
    () => invoke(cmdName, camel),
    () => invoke(cmdName, snake),
  ];
  if (!paramsObj || Object.keys(paramsObj).length === 0) candidates.push(() => invoke(cmdName));
  return tryCandidates(candidates, cmdName);
}

// --- Tags ---
export async function tagItemBySession(sessionToken, path, tagId) {
  if (!sessionToken) throw new Error('sessionToken required');
  if (!path || !tagId) throw new Error('path and tagId required');
  return invokeCamelThenSnake('fs_tag_item_by_session', {
    sessionToken: sessionToken,
    path,
    tagId,
  });
}

function normalizePathForCall(p) {
  if (!p) return p;
  let s = String(p);
  if (s.startsWith('\\\\?\\')) s = s.slice(4);
  s = s.replace(/\//g, '\\');
  s = s.replace(/[\\\/]+$/, '');
  return s;
}

export async function listTagsBySession(sessionTokenOrNull, path) {
  if (!path) throw new Error('path required');

  const candidates = [];

  if (sessionTokenOrNull) {
    const snake = { session_token: sessionTokenOrNull, path };
    const camel = { sessionToken: sessionTokenOrNull, path };
    candidates.push(() => invoke('fs_list_tags_by_session', camel));
    candidates.push(() => invoke('fs_list_tags_by_session', snake));
    candidates.push(() => invoke('fsListTagsBySession', camel));
    candidates.push(() => invoke('fsListTagsBySession', snake));
  }

  candidates.push(() => invoke('fs_list_tags_by_session', { path }));
  candidates.push(() => invoke('list_tags_for_path', { path }));
  candidates.push(() => invoke('list_tags_by_path', { path }));
  candidates.push(() => invoke('get_tags_for_path', { path }));

  return tryCandidates(candidates, 'listTagsBySession');
}

export async function listPathsByTag(sessionTokenOrNull, tag) {
  if (!tag) return [];

  const candidates = [
    () => invoke('list_paths_by_tag', { tag }),
    () => invoke('get_paths_by_tag', { tag }),
    () => invoke('fs_list_paths_by_tag', { tag }),
    () => invoke('list_paths_by_tag', { Tag: tag }),
  ];

  if (sessionTokenOrNull) {
    candidates.unshift(() => invoke('list_paths_by_tag', { session_token: sessionTokenOrNull, tag }));
    candidates.unshift(() => invoke('list_paths_by_tag', { sessionToken: sessionTokenOrNull, tag }));
  }

  const res = await tryCandidates(candidates, 'listPathsByTag');
  if (!res) return [];
  if (!Array.isArray(res)) return [];
  return res.map(r => {
    if (typeof r === 'string') return r;
    if (Array.isArray(r)) {
      return r.find(x => typeof x === 'string' && (x.includes('\\') || x.includes('/'))) || String(r[1] || r[0]);
    }
    return r.path || r.Path || r[1] || String(r);
  });
}

export async function untagItemBySession(sessionToken, path, tagId) {
  if (!sessionToken) throw new Error('sessionToken required');
  if (!path || !tagId) throw new Error('path and tagId required');
  return invokeCamelThenSnake('fs_untag_item_by_session', {
    sessionToken: sessionToken,
    path,
    tagId,
  });
}

function toWindowsLongPath(path) {
  if (!path) return path;
  const s0 = String(path);
  if (s0.startsWith('\\\\?\\')) return s0;
  const s = s0.replace(/\//g, '\\');
  if (/^[A-Za-z]:\\/.test(s) || /^[A-Za-z]:\/.*/.test(s0)) {
    return '\\\\?\\' + s;
  }
  if (s.startsWith('\\\\')) {
    const withoutLeading = s.replace(/^\\\\/, '');
    return '\\\\?\\UNC\\' + withoutLeading;
  }
  return s0;
}

export async function searchFilesByTag(sessionToken, tag, limit = 200, offset = 0) {
  if (!tag) return [];
  let tagToSend = tag;
  try {
    if (typeof tag === 'string' && (tag.includes('\\') || tag.includes('/') || /^[A-Za-z]:/.test(tag))) {
      tagToSend = toWindowsLongPath(tag);
    }
  } catch (e) {
    tagToSend = tag;
  }

  const candidates = [
    () => invoke('search_files_by_tag', { tag: tagToSend, limit, offset }),
    () => invoke('search_files_by_tag', { Tag: tagToSend, limit, offset }),
    () => invoke('search_files_by_tag', { sessionToken, tag: tagToSend, limit, offset }),
    () => invoke('search_files_by_tag', { session_token: sessionToken, tag: tagToSend, limit, offset }),
  ];
  return tryCandidates(candidates, 'searchFilesByTag');
}

// Open path (file or dir) via backend with session auth
export async function openPathBySession(sessionToken, path) {
  if (!path) throw new Error('path required');
  const candidates = [
    () => invoke('open_path_by_session', { session_token: sessionToken, path }),
    () => invoke('open_path_by_session', { sessionToken, path }),
    () => invoke('openPathBySession', { session_token: sessionToken, path }),
    () => invoke('openPathBySession', { sessionToken, path }),
    () => invoke('open_path_by_session', { path }),
    () => invoke('openPathBySession', { path }),
    () => invoke('open_path', { session_token: sessionToken, path }),
    () => invoke('open', { path }),
  ];
  return tryCandidates(candidates, 'openPathBySession');
}

// --- Rename / Move / Delete / Copy (admin ops) ---
// paste/replace this function in src/lib/fsClient.js
export async function renameItemBySession(sessionToken, oldPath, newPath) {
  if (!sessionToken) throw new Error('sessionToken required');
  if (!oldPath || !newPath) throw new Error('paths required');

  // Primary: call the Rust command you already have implemented:
  // fs_rename_by_session(session_token, old_path, new_path)
  const primary = [
    () => invoke('fs_rename_by_session', { session_token: sessionToken, old_path: oldPath, new_path: newPath }),
    () => invoke('fs_rename_by_session', { sessionToken: sessionToken, oldPath, newPath }), // camel fallback
  ];

  // Small set of sane fallbacks (ordered).
  const fallback = [
    // alternate canonical rename names
    () => invoke('fs_rename', { session_token: sessionToken, old_path: oldPath, new_path: newPath }),
    () => invoke('fs_rename', { sessionToken: sessionToken, oldPath, newPath }),

    // last-resort (dev builds might accept unauthenticated rename)
    () => invoke('fs_rename_by_session', { old_path: oldPath, new_path: newPath }),
    () => invoke('rename_file', { from: oldPath, to: newPath }),
  ];

  // Try primary first, then fallbacks using your tryCandidates helper
  try {
    return await tryCandidates([...primary, ...fallback], 'renameItemBySession');
  } catch (err) {
    // improve error message for frontend
    console.error('[fsClient] renameItemBySession giving up:', err);
    throw err;
  }
}


// --- robust delete wrapper ---
export async function deleteItemBySession(sessionToken, path) {
  if (!sessionToken) throw new Error('sessionToken required');
  if (!path) throw new Error('path required');

  // build both snake_case and camelCase param objects
  const paramsSnake = { session_token: sessionToken, path };
  const paramsCamel = { sessionToken: sessionToken, path };

  const candidates = [
    // authoritative name first
    () => invoke('fs_delete_by_session', paramsSnake),
    () => invoke('fs_delete_by_session', paramsCamel),
  ];

  return tryCandidates(candidates, 'deleteItemBySession');
}


export async function copyItemBySession(sessionToken, srcPath, dstPath) {
  if (!sessionToken) throw new Error('sessionToken required');
  if (!srcPath || !dstPath) throw new Error('paths required');

  const paramsVariants = [
    // snake-case backend variants
    { session_token: sessionToken, src_path: srcPath, dst_path: dstPath },
    { session_token: sessionToken, src_path: srcPath, dest_path: dstPath },

    // camel-case variants
    { sessionToken: sessionToken, srcPath: srcPath, dstPath: dstPath },
    { sessionToken: sessionToken, srcPath: srcPath, destPath: dstPath },

    // some backends expect 'src'/'dst' or 'from'/'to'
    { session_token: sessionToken, src: srcPath, dst: dstPath },
    { session_token: sessionToken, from: srcPath, to: dstPath },
  ];

  const candidates = [];
  for (const p of paramsVariants) {
    candidates.push(() => invoke('fs_copy_by_session', p));
    candidates.push(() => invoke('fs_copy', p));
    candidates.push(() => invoke('copy_file', p));
  }
  // also try camel command names
  candidates.push(() => invoke('fsCopyBySession', { sessionToken, srcPath, dstPath }));
  candidates.push(() => invoke('copyFile', { sessionToken, srcPath, dstPath }));

  return tryCandidates(candidates, 'copyItemBySession');
}

// replace moveItemBySession — prefer renameItemBySession but keep tolerant fallbacks
export async function moveItemBySession(sessionToken, srcPath, dstPath) {
  if (!sessionToken) throw new Error('sessionToken required');
  if (!srcPath || !dstPath) throw new Error('paths required');

  const params = { session_token: sessionToken, src_path: srcPath, dst_path: dstPath };
  const [snake, camel] = buildParamVariants(params);

  return tryCandidates([
    () => invoke('fs_move_by_session', snake),
    () => invoke('fs_move_by_session', camel),
    () => invoke('fs_move', snake),
    () => invoke('fs_move', camel),
    () => invoke('fs_rename_by_session', snake),
    () => invoke('fs_rename_by_session', camel),
    () => invoke('fs_move', { sessionToken: sessionToken, srcPath: srcPath, destPath: dstPath }), // last fallback
  ], 'moveItemBySession');
}

export async function mkdirBySession(sessionToken, path) {
  if (!sessionToken) throw new Error('sessionToken required');
  if (!path) throw new Error('path required');
  return tryCandidates([
    () => invoke('fs_mkdir_by_session', { session_token: sessionToken, path }),
    () => invoke('fs_mkdir_by_session', { sessionToken, path }),
    () => invoke('fs_mkdir', { session_token: sessionToken, path }),
    () => invoke('fs_mkdir', { sessionToken, path }),
    () => invoke('make_dir', { session_token: sessionToken, path }),
  ], 'mkdirBySession');
}

export async function createFileBySession(sessionToken, path, content = null) {
  if (!sessionToken) throw new Error('sessionToken required');
  if (!path) throw new Error('path required');
  const params = { session_token: sessionToken, path };
  if (content !== null) params.content = content;
  const [snake, camel] = buildParamVariants(params);
  return tryCandidates([
    () => invoke('fs_create_file_by_session', snake),
    () => invoke('fs_create_file_by_session', camel),
    () => invoke('fs_create_file', snake),
    () => invoke('fs_create_file', camel),
    () => invoke('create_file', snake),
    () => invoke('create_file', camel),
  ], 'createFileBySession');
}

/**
 * listDir(sessionToken, path)
 */
export async function listDir(sessionToken, path) {
  if (!path) throw new Error('path required');

  const candidates = [];
  if (sessionToken) {
    candidates.push(() => invoke('read_dir', { session_token: sessionToken, path }));
    candidates.push(() => invoke('read_dir', { sessionToken, path }));
  }
  candidates.push(() => invoke('read_dir', { path }));

  return tryCandidates(candidates, 'listDir');
}

// searchFiles: always send 'q' (required by Rust). sessionToken is optional.
export async function searchFiles(sessionToken, query, limit = 200, offset = 0) {
  if (!query || !String(query).trim()) return [];
  const q = String(query).trim();

  const candidates = [
    () => invoke('search_files', { q, limit, offset }),
    () => invoke('search_files', { query: q, limit, offset }),
  ];

  if (sessionToken) {
    candidates.unshift(() => invoke('search_files', { session_token: sessionToken, q, limit, offset }));
    candidates.push(() => invoke('search_files', { session_token: sessionToken, query: q, limit, offset }));
    candidates.push(() => invoke('search_files', { sessionToken, q, limit, offset }));
  }

  let lastErr = null;
  for (const c of candidates) {
    try {
      const res = await c();
      return res;
    } catch (e) {
      lastErr = e;
      console.warn('[fsClient] searchFiles candidate failed:', e);
    }
  }

  throw new Error('searchFiles failed: ' + (lastErr ? normalizeError(lastErr) : 'unknown error'));
}

export async function indexPathStart(sessionToken, rootPath) {
  if (!sessionToken) throw new Error('sessionToken required');
  if (!rootPath) throw new Error('rootPath required');

  return tryCandidates([
    () => invoke('index_path_start', { session_token: sessionToken, root_path: rootPath }),
    () => invoke('index_path_start', { sessionToken, rootPath }),
    () => invoke('indexPathStart', { session_token: sessionToken, rootPath }),
    () => invoke('index_path', { session_token: sessionToken, root_path: rootPath }),
  ], 'indexPathStart');
}

export async function indexAllDrivesStart(sessionToken) {
  if (!sessionToken) throw new Error('sessionToken required');
  return tryCandidates([
    () => invoke('index_all_drives_start', { session_token: sessionToken }),
    () => invoke('index_all_drives_start', { sessionToken }),
    () => invoke('indexAllDrivesStart', { session_token: sessionToken }),
    () => invoke('index_all_drives_start', { sessionToken: sessionToken }),
  ], 'indexAllDrivesStart');
}

export async function indexAllDrives(sessionToken, onStatus = null, pollIntervalMs = 1200) {
  if (!sessionToken) {
    if (sessionClient && sessionClient.getSessionToken) {
      sessionToken = await sessionClient.getSessionToken();
      if (!sessionToken) throw new Error('sessionToken required (no saved session)');
    } else {
      throw new Error('sessionToken required');
    }
  }

  const jobId = await indexAllDrivesStart(sessionToken);
  if (onStatus) onStatus({ jobId, state: 'started' });

  while (true) {
    const status = await getIndexStatus(jobId);
    if (!status) {
      if (onStatus) onStatus({ jobId, state: 'unknown' });
      break;
    }

    if (status.Running) {
      const { processed, last_path } = status.Running;
      if (onStatus) onStatus({ jobId, state: 'running', processed, lastPath: last_path });
    } else if (status.Finished) {
      const { processed } = status.Finished;
      if (onStatus) onStatus({ jobId, state: 'finished', processed });
      break;
    } else if (status.Failed) {
      const { message } = status.Failed;
      if (onStatus) onStatus({ jobId, state: 'failed', message });
      break;
    } else {
      if (onStatus) onStatus({ jobId, state: 'unknown', raw: status });
      break;
    }

    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }

  try {
    const filesPerDrive = await getFilesPerDrive();
    const indexingByDrive = await getIndexingByDriveAndType();
    return { jobId, filesPerDrive, indexingByDrive };
  } catch (e) {
    return { jobId, error: normalizeError(e) };
  }
}

export async function getIndexStatus(jobId) {
  if (!jobId) throw new Error('jobId required');
  return tryCandidates([
    () => invoke('get_index_status', { job_id: jobId }),
    () => invoke('get_index_status', { jobId }),
    () => invoke('getIndexStatus', { job_id: jobId }),
    () => invoke('getIndexStatus', { jobId }),
  ], 'getIndexStatus');
}

export async function indexPath(sessionToken, rootPath) {
  if (!sessionToken) throw new Error('sessionToken required');
  return tryCandidates([
    () => invoke('index_path', { session_token: sessionToken, root_path: rootPath }),
    () => invoke('index_path', { sessionToken, rootPath }),
  ], 'indexPath');
}

// Open using Tauri plugin-shell if available; otherwise fallback to window.open
export async function openWithSystemApp(path) {
  if (!path) throw new Error('path required');

  // helpers to normalize paths / convert to file:// URL
  function stripLongPrefix(s) {
    if (!s) return s;
    let t = String(s);
    if (t.startsWith('\\\\?\\')) t = t.slice(4);
    if (t.startsWith('\\?\\')) t = t.slice(3);
    return t;
  }

  function toFileUrl(p) {
    if (!p) return p;
    let s = stripLongPrefix(p);
    s = s.replace(/\\/g, '/');

    // Already a URL-like scheme? return as-is
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) {
      return s;
    }

    // Windows absolute: C:/...
    if (/^[A-Za-z]:\//.test(s)) {
      // Ensure no leading slash before drive letter
      if (s[0] === '/') s = s.slice(1);
      return 'file:///' + encodeURI(s);
    }

    // UNC or //server/path -> file://server/path
    if (s.startsWith('//')) {
      // remove leading slashes to avoid file:////server
      return 'file:' + encodeURI(s);
    }

    // Generic fallback
    return 'file:///' + encodeURI(s.replace(/^\/*/, ''));
  }

  // Try a few strategies, prefer native path first (tauriOpen typically accepts a URL or native path)
  const tried = [];

  // 1) Try raw (normalized) native path
  try {
    const native = stripLongPrefix(path);
    await tauriOpen(native);
    return;
  } catch (e) {
    tried.push({ method: 'native', error: e });
    console.debug('[fsClient] openWithSystemApp: native open failed', e);
  }

  // 2) Try a file:// URL
  try {
    const url = toFileUrl(path);
    await tauriOpen(url);
    return;
  } catch (e) {
    tried.push({ method: 'fileUrl', error: e });
    console.debug('[fsClient] openWithSystemApp: file:// open failed', e);
  }

  // 3) As last client-side fallback, try window.open (should work in some environments)
  try {
    const url = toFileUrl(path);
    window.open(url, '_blank');
    return;
  } catch (e) {
    tried.push({ method: 'windowOpen', error: e });
    console.debug('[fsClient] openWithSystemApp: window.open failed', e);
  }

  // If execution reaches here, everything failed
  const messages = tried.map(t => `${t.method}: ${String(t.error?.message || t.error)}`).join(' | ');
  throw new Error('openWithSystemApp failed: ' + messages);
}
// Open a file via backend (preferred) or fall back to plugin-shell open.
export async function openFileBySession(sessionTokenOrNull, path) {
  if (!path) throw new Error('path required');

  // If sessionToken provided, try camel/snake first using helper to avoid mismatch
  const candidates = [];

  if (sessionTokenOrNull) {
    // prefer invoking with camelCase then snake (helper will try both)
    candidates.push(() =>
      invokeCamelThenSnake('open_file_by_session', {
        sessionToken: sessionTokenOrNull,
        path,
      })
    );
    // Some builds might expose camel command name
    candidates.push(() =>
      invokeCamelThenSnake('openFileBySession', {
        sessionToken: sessionTokenOrNull,
        path,
      })
    );
  }

  // unauthenticated variants
  candidates.push(() => invoke('open_file_by_session', { path }));
  candidates.push(() => invoke('openFileBySession', { path }));
  candidates.push(() => invoke('open_path_by_session', { path }));
  candidates.push(() => invoke('open_path', { path }));

  try {
    const res = await tryCandidates(candidates, 'openFileBySession');
    return res;
  } catch (err) {
    console.warn('[fsClient] openFileBySession backends failed, falling back to openWithSystemApp:', err);
    return openWithSystemApp(path);
  }
}