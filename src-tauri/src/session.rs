// src-tauri/src/session.rs
use crate::db::{create_session_token, get_session, revoke_session};
use chrono::Utc;
use rusqlite::Connection;

/// Create a new session token for the given user_id.
/// Wrapper over db::create_session_token
pub fn create_session(conn: &Connection, user_id: i64, ttl_seconds: i64) -> Result<String, String> {
    create_session_token(conn, user_id, Some(ttl_seconds))
}

/// Validate a session token.
///
/// Returns:
///   Ok(Some(user_id)) if valid
///   Ok(None) if expired or not found
///   Err(..) for DB errors
pub fn validate_session(conn: &Connection, token: &str) -> Result<Option<i64>, String> {
    if let Some((_token, user_id, expires_at_opt)) = get_session(conn, token)? {
        // if expires set and now > expires -> expired
        if let Some(exp) = expires_at_opt {
            if Utc::now().timestamp() > exp {
                return Ok(None);
            }
        }
        return Ok(Some(user_id));
    }
    Ok(None)
}

/// Revoke (delete) a session token
pub fn revoke_session_token(conn: &Connection, token: &str) -> Result<(), String> {
    revoke_session(conn, token)
}
