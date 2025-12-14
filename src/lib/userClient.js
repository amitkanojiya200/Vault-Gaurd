// src/lib/userClient.js
import { invoke } from '@tauri-apps/api/core';
import { authLogin, authRegister, authLogout } from './authClient'; // re-use

function normalizeError(err) {
    if (!err) return 'Unknown error';
    if (err?.message) return err.message;
    if (typeof err === 'string') return err;
    try { return JSON.stringify(err); } catch { return String(err); }
}

/* ---------------------------
   Re-export auth helpers
   --------------------------- */

export { authLogin, authRegister, authLogout };

/* ---------------------------
   Session / Profile
   --------------------------- */
export async function validateSession(sessionToken) {
    if (!sessionToken) throw new Error('sessionToken required');
    try {
        const res = await invoke('validate_session', {
            // send BOTH, so whichever the Rust side expects will be satisfied
            sessionToken: sessionToken,
            session_token: sessionToken,
        });

        // normalize possible shapes:
        if (Array.isArray(res) && res.length > 0) {
            return res[0];
        }
        if (res && typeof res === 'object') {
            if ('user' in res) return res.user;
            return res; // already UserPublic
        }
        return null;
    } catch (err) {
        throw new Error(normalizeError(err));
    }
}

// Try multiple invoke variants until one succeeds.
// params: sessionToken (string), newName (string|null), newUsername (string|null), newPassword (string|null)
export async function updateProfile(sessionToken, newName = null, newUsername = null, newPassword = null) {
  if (!sessionToken) throw new Error('sessionToken required');

  // Build candidate payloads with common naming variants
  const candidates = [];

  // snake_case command & params (typical on Rust side)
  candidates.push(() =>
    invoke('update_profile_by_session', {
      session_token: sessionToken,
      new_name: newName,
      new_username: newUsername,
      new_password: newPassword,
    })
  );

  // camelCase command & params (some builds compile metadata differently)
  candidates.push(() =>
    invoke('update_profile_by_session', {
      sessionToken: sessionToken,
      newName: newName,
      newUsername: newUsername,
      newPassword: newPassword,
    })
  );

  // alternate command name (camel) with snake params
  candidates.push(() =>
    invoke('updateProfileBySession', {
      session_token: sessionToken,
      new_name: newName,
      new_username: newUsername,
      new_password: newPassword,
    })
  );

  // alternate command name (camel) with camel params
  candidates.push(() =>
    invoke('updateProfileBySession', {
      sessionToken: sessionToken,
      newName: newName,
      newUsername: newUsername,
      newPassword: newPassword,
    })
  );

  // older/no-prefix versions (some forks)
  candidates.push(() =>
    invoke('update_profile', {
      session_token: sessionToken,
      name: newName,
      username: newUsername,
      password: newPassword,
    })
  );
  candidates.push(() =>
    invoke('updateProfile', {
      sessionToken: sessionToken,
      name: newName,
      username: newUsername,
      password: newPassword,
    })
  );

  // Try each candidate sequentially and return first success
  let lastErr = null;
  for (let i = 0; i < candidates.length; i++) {
    try {
      const res = await candidates[i]();
      console.debug(`[userClient.updateProfile] candidate ${i} succeeded ->`, res);
      // Prefer to return the user object if backend provided it
      return res;
    } catch (e) {
      lastErr = e;
      console.warn(`[userClient.updateProfile] candidate ${i} failed:`, e);
      // continue trying next candidate
    }
  }

  throw new Error('updateProfile failed: ' + (lastErr ? normalizeError(lastErr) : 'unknown error'));
}

/* ---------------------------
   Admin operations
   --------------------------- */
export async function adminGetUser(sessionToken, targetId) {
    if (!sessionToken) throw new Error('sessionToken required');
    if (typeof targetId !== 'number') throw new Error('targetId must be number');
    try {
        return await invoke('admin_get_user_cmd', { session_token: sessionToken, target_id: targetId });
    } catch (err) {
        throw new Error(normalizeError(err));
    }
}

/**
 * get_storage_info_with_scan(window = '24h')
 * - Tries several backend command names for compatibility.
 * - Normalizes many possible shapes into: [{ drive, totalGB, usedGB, lastScan, raw }, ...]
 *
 * window: '24h' | '48h' | '1w' | '1m' (string) - purely advisory to backend
 */
export async function get_storage_info_with_scan(window = '24h') {
    const candidates = [
        () => invoke('get_storage_info_with_scan', { window }),
        () => invoke('get_storage_info', { window }),
        () => invoke('get_files_per_drive'),
    ];

    let raw = null;
    let lastErr = null;
    for (const call of candidates) {
        try {
            raw = await call();
            if (raw != null) break;
        } catch (e) {
            lastErr = e;
        }
    }

    if (!raw) {
        console.warn('[userClient] get_storage_info_with_scan: no response (returning empty array).', lastErr);
        return [];
    }

    const out = [];
    // Case: array-of-arrays e.g. [[drive, totalGB, usedGB, lastScanEpoch], ...]
    if (Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0])) {
        for (const r of raw) {
            out.push({
                drive: r[0] ?? 'unknown',
                totalGB: r[1] ?? null,
                usedGB: r[2] ?? null,
                lastScan: r[3] ?? null,
                raw: r,
            });
        }
        return out;
    }

    // Case: array-of-objects e.g. [{ drive, totalGB, usedGB, lastScan }, ...]
    if (Array.isArray(raw)) {
        for (const o of raw) {
            out.push({
                drive: o.drive ?? o.name ?? o.id ?? 'unknown',
                totalGB: o.totalGB ?? o.total ?? o.size_total_gb ?? null,
                usedGB: o.usedGB ?? o.used ?? o.size_used_gb ?? null,
                lastScan: o.lastScan ?? o.last_scan ?? o.scanned_at ?? null,
                raw: o,
            });
        }
        return out;
    }

    // Case: object with rows property -> { rows: [...] }
    if (raw && typeof raw === 'object' && Array.isArray(raw.rows)) {
        for (const o of raw.rows) {
            out.push({
                drive: o.drive ?? o.name ?? 'unknown',
                totalGB: o.totalGB ?? o.total ?? null,
                usedGB: o.usedGB ?? o.used ?? null,
                lastScan: o.lastScan ?? o.last_scan ?? o.scanned_at ?? null,
                raw: o,
            });
        }
        return out;
    }

    // Unknown shape -> return empty
    console.warn('[userClient] get_storage_info_with_scan: unknown response shape', raw);
    return [];
}

/**
 * get_portal_audit_logs(sessionToken = null, window = '24h', limit = 200)
 * - If sessionToken provided and admin, prefer adminListAuditLogs (already exported)
 * - Otherwise try other candidate commands and return the raw result for dashboard normalizer
 */
export async function get_portal_audit_logs(sessionToken = null, window = '24h', limit = 200) {
    // If we have a sessionToken and admin privileges, adminListAuditLogs already normalizes tuple rows.
    if (sessionToken && typeof adminListAuditLogs === 'function') {
        try {
            // adminListAuditLogs will throw if the session isn't admin; let fallback happen then.
            return await adminListAuditLogs(sessionToken, limit);
        } catch (e) {
            console.warn('[userClient] adminListAuditLogs failed, falling back to generic portal logs:', e);
        }
    }

    const candidates = [
        () => invoke('get_portal_audit_logs', { window, limit }),
        () => invoke('get_portal_logs', { window, limit }),
        // fallback: maybe audit logs exist as a public feed
        () => invoke('list_audit_logs', { limit }),
    ];

    let raw = null;
    let lastErr = null;
    for (const call of candidates) {
        try {
            raw = await call();
            if (raw != null) break;
        } catch (e) {
            lastErr = e;
        }
    }

    if (!raw) {
        console.warn('[userClient] get_portal_audit_logs: no response (returning []).', lastErr);
        return [];
    }

    // Return raw — Dashboard will attempt to normalize many shapes.
    return raw;
}
/**
 * adminListAuditLogs(sessionToken, limit = 200)
 * Tries several possible invoke command names for compatibility with your Rust filenames.
 *
 * Expected return: array of tuples/rows like:
 *  [id, actor_user_id, actor_username, action, target_user_id, details, created_at]
 */
export async function adminListAuditLogs(sessionToken, limit = 200) {
    if (!sessionToken) throw new Error('sessionToken required');

    // candidate invoke names (include the exact Rust command name you provided)
    const candidates = [
        () => invoke('admin_list_audit_logs', { session_token: sessionToken, limit }),
        () => invoke('admin_list_audit_logs_cmd', { session_token: sessionToken, limit }),
        () => invoke('list_audit_logs', { session_token: sessionToken, limit }),
        () => invoke('get_audit_logs', { session_token: sessionToken, limit }),
    ];

    let raw = null;
    let lastError = null;

    for (const call of candidates) {
        try {
            raw = await call();
            if (raw != null) break;
        } catch (e) {
            lastError = e;
            // try next fallback
        }
    }

    if (raw == null) {
        const errMsg = lastError ? normalizeError(lastError) : 'no response from audit logs';
        console.error('[userClient] adminListAuditLogs failed (all candidates):', errMsg);
        // return empty array to keep UI functional
        return [];
    }

    console.debug('[userClient] adminListAuditLogs raw response:', raw);

    // ---------- Normalization ----------
    // target: array of 7-element tuples:
    // [id, actor_user_id, actor_username, action, target_user_id, details, created_at]

    const toEpoch = (v) => {
        if (v == null) return null;
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
            const n = Number(v);
            if (!Number.isNaN(n)) return n;
            const d = Date.parse(v);
            if (!Number.isNaN(d)) return Math.floor(d / 1000);
        }
        return null;
    };

    const rows = [];

    // Case A: array-of-arrays (your Rust returns this shape) — accept directly but coerce created_at
    if (Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0])) {
        for (const r of raw) {
            // Ensure we have at least 7 slots; fill missing with null
            const filled = [
                r[0] ?? null,
                r[1] ?? null,
                r[2] ?? null,
                r[3] ?? null,
                r[4] ?? null,
                r[5] ?? null,
                toEpoch(r[6]) ?? null,
            ];
            rows.push(filled);
        }
        return rows;
    }

    // Case B: array-of-objects — map common keys to tuple
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'object') {
        for (const obj of raw) {
            const id = obj.id ?? obj.log_id ?? null;
            const actor_user_id = obj.actor_user_id ?? obj.actor_id ?? obj.actor ?? null;
            const actor_username = obj.actor_username ?? obj.actor_name ?? obj.actor ?? null;
            const action = obj.action ?? obj.event ?? obj.type ?? obj.op ?? '';
            const target_user_id = obj.target_user_id ?? obj.target_id ?? null;
            const details = obj.details ?? obj.data ?? obj.payload ?? null;
            const created_at = toEpoch(obj.created_at ?? obj.createdAt ?? obj.ts ?? obj.timestamp ?? null);
            rows.push([id, actor_user_id, actor_username, action, target_user_id, details, created_at]);
        }
        return rows;
    }

    // Case C: object with rows property
    if (raw && typeof raw === 'object' && Array.isArray(raw.rows)) {
        // normalize recursively
        const nested = raw.rows;
        if (Array.isArray(nested) && nested.length > 0) {
            // reuse logic by assigning raw = nested and rerun normalization quickly
            raw = nested;
            // fall through to earlier branches by simple recursion:
            return adminListAuditLogs(sessionToken, limit); // note: should not loop infinitely because recursion resolves to arrays
        }
    }

    console.warn('[userClient] adminListAuditLogs: unrecognized response shape — returning empty array.', raw);
    return [];
}
/* ---------------------------
   Optional extra endpoints (indexing, files per drive) — safe fallbacks
   --------------------------- */
export async function get_files_per_drive() {
    try {
        return await invoke('get_files_per_drive');
    } catch (e) {
        return null;
    }
}

/* Admin helpers */
export async function adminListUsers(session_token) {
    if (!session_token) throw new Error('session_token required');
    try {
        console.log('userClient session token '+session_token);
        return await invoke('admin_list_users_cmd', { sessionToken: session_token,session_token: session_token });
    } catch (err) {
        throw new Error(normalizeError(err));
    }
}

export async function adminCreateUser(sessionToken, name, username, email, password, role = 'user') {
    if (!sessionToken) throw new Error('sessionToken required');
    try {
        return await invoke('admin_create_user_cmd', { sessionToken: sessionToken, name, username, email, password, role });
    } catch (err) {
        throw new Error(normalizeError(err));
    }
}

export async function adminUpdateUser(sessionToken, id, name, username, email, password, role = 'user') {
    if (!sessionToken) throw new Error('sessionToken required');
    try {
        return await invoke('admin_update_user_cmd', { sessionToken: sessionToken, id, name, username, email, password, role });
    } catch (err) {
        throw new Error(normalizeError(err));
    }
}

export async function adminDeleteUser(sessionToken, id) {
    if (!sessionToken) throw new Error('sessionToken required');
    try {
        return await invoke('admin_delete_user_cmd', { sessionToken: sessionToken, id });
    } catch (err) {
        throw new Error(normalizeError(err));
    }
}
