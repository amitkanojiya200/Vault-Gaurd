// src/lib/sessionClient.js
import { invoke } from '@tauri-apps/api/core';

const KEY_NAME = 'vaultguard_session_token';

function normalizeError(err) {
    if (!err) return 'Unknown error';
    if (err?.message) return err.message;
    if (typeof err === 'string') return err;
    try { return JSON.stringify(err); } catch { return String(err); }
}

export default {
    // store token securely in OS keyring (Rust command)
    async setSessionToken(token) {
        if (!token) throw new Error('token required');
        try {
            const res = await invoke('session_store_set', { key: KEY_NAME, token });
            return res === true;
        } catch (err) {
            console.error('sessionClient.setSessionToken failed:', err);
            // Do NOT throw – let login continue, just signal failure
            return false;
        }
    },

    // get token from keyring (Rust command)
    async getSessionToken() {
        try {
            const token = await invoke('session_store_get', { key: KEY_NAME });
            return token ?? null; // Option<String> -> string | null
        } catch (err) {
            console.error('sessionClient.getSessionToken failed:', err);
            return null;
        }
    },

    // clear token
    async clearSessionToken() {
        try {
            const res = await invoke('session_store_clear', { key: KEY_NAME });
            return res === true;
        } catch (err) {
            console.error('sessionClient.clearSessionToken failed:', err);
            return false;
        }
    },
};
