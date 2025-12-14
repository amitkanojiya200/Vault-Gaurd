// src/lib/adminClient.js
import { invoke } from '@tauri-apps/api/core';

function normalizeError(err) {
    if (!err) return 'Unknown error';
    if (err?.message) return err.message;
    if (typeof err === 'string') return err;
    try { return JSON.stringify(err); } catch { return String(err); }
}

/**
 * Build a payload that contains both snake_case and camelCase keys so
 * it works regardless of how the Rust side names the parameters.
 */
function buildPayload(sessionToken, opts = {}) {
    const windowVal = opts.window || '24h';
    const limitVal = opts.limit ?? 200;

    return {
        // both variants for session token
        session_token: sessionToken,
        sessionToken: sessionToken,

        // both variants for window
        window: windowVal,
        time_window: windowVal,
        timeWindow: windowVal,

        // both variants for limit
        limit: limitVal,
        max: limitVal,
        count: limitVal,
    };
}

export async function getPortalAuditLogs(sessionToken, opts = {}) {
    try {
        const payload = buildPayload(sessionToken, opts);
        const res = await invoke('get_portal_audit_logs', payload);
        return res;
    } catch (e) {
        throw new Error(normalizeError(e));
    }
}

export async function getWatchlistBlockedAttempts(sessionToken, opts = {}) {
    try {
        const payload = buildPayload(sessionToken, opts);
        const res = await invoke('get_watchlist_blocked_attempts', payload);
        return res;
    } catch (e) {
        throw new Error(normalizeError(e));
    }
}
