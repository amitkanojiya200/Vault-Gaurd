// src/lib/authClient.js
import { invoke } from '@tauri-apps/api/core';

function normalizeError(err) {
  if (!err) return 'Unknown error';
  if (err?.message) return err.message;
  if (typeof err === 'string') return err;
  try { return JSON.stringify(err); } catch { return String(err); }
}

/**
 * authLogin -> backend returns either:
 *   [user, token]          (tuple)
 *   { user, token }        (object)
 *   user                   (no token)
 */
export async function authLogin(username, password) {
  if (!username || !password) {
    throw new Error('Username and password are required.');
  }

  try {
    const res = await invoke('auth_login', { username, password, ip: null });

    let user = null;
    let token = null;

    if (Array.isArray(res)) {
      [user, token] = res;
    } else if (res && typeof res === 'object') {
      if ('user' in res || 'token' in res) {
        user = res.user ?? null;
        token = res.token ?? null;
      } else {
        // Some code returns plain user struct object
        user = res;
      }
    } else {
      // Unexpected primitive
      user = res;
    }

    if (!user) {
      throw new Error('Login failed: backend returned no user.');
    }

    return { user, token };
  } catch (err) {
    throw new Error(normalizeError(err));
  }
}

/**
 * authRegister -> backend signature: auth_register(name, username, password, email, role)
 * returns created UserPublic
 */
export async function authRegister(name, username, password, role = 'user', email = null) {
  if (!name || !username || !password) throw new Error('All fields are required.');
  try {
    const user = await invoke('auth_register', { name, username, password, email, role });
    return user;
  } catch (err) {
    throw new Error(normalizeError(err));
  }
}

/**
 * authLogout
 */
export async function authLogout(sessionToken) {
  if (!sessionToken) throw new Error('Session token required.');
  try {
    return await invoke('auth_logout', { session_token: sessionToken });
  } catch (err) {
    throw new Error(normalizeError(err));
  }
}
