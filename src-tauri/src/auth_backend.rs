// src-tauri/src/auth_backend.rs
use crate::db::{
    create_session_token, get_session, get_user_by_id_row, get_user_by_username_row,
    init_db_schema, insert_audit_log, insert_failed_login, insert_login_history, insert_user_full,
    update_last_login,
};
use crate::security::{hash_password, verify_password};
use crate::session;
use serde::Serialize;
use tauri::{command, AppHandle};

#[derive(Debug, Serialize)]
pub struct UserPublic {
    pub id: i64,
    pub name: String,
    pub username: String,
    pub email: Option<String>,
    pub role: String,
    pub created_at: i64,
    pub last_login: Option<i64>,
}

/// NOTE:
/// This module expects `db::open_connection_app(&AppHandle) -> Result<rusqlite::Connection, String>`
/// to exist in `db.rs`. That function should resolve the OS-specific data folder via
/// `tauri-plugin-path` (or equivalent) and open the sqlite DB there so writes do NOT
/// trigger project-folder file changes (which cause dev reloads).
///
/// Example signature to add in db.rs:
/// pub fn open_connection_app(app: &tauri::AppHandle) -> Result<rusqlite::Connection, String> { ... }

////////////////////////////////////////////////////////////////////////////////
// Register / Login / Logout / Validate
////////////////////////////////////////////////////////////////////////////////

/// Register a new user (default role = 'user')
#[command]
pub fn auth_register(
    _app: AppHandle,
    name: String,
    username: String,
    password: String,
    email: Option<String>,
    role: Option<String>,
) -> Result<UserPublic, String> {
    if name.trim().is_empty() || username.trim().is_empty() || password.trim().is_empty() {
        return Err("All fields are required.".into());
    }
    if username.len() < 3 || password.len() < 6 {
        return Err("Username must be >=3 and password >=6 characters.".into());
    }

    // Open DB using AppHandle-aware helper (must be implemented in db.rs)
    let conn = crate::db::open_connection()?;
    // Ensure schema exists
    init_db_schema(&conn)?;

    // username uniqueness
    if let Some(_) = get_user_by_username_row(&conn, &username)? {
        return Err("Username already exists".into());
    }

    let ph = hash_password(&password)?;
    let assigned_role = role.unwrap_or_else(|| "user".to_string());

    let user_id = insert_user_full(
        &conn,
        &name,
        &username,
        email.as_deref(),
        &ph,
        &assigned_role,
    )?;

    // Audit: user registration
    let _ = insert_audit_log(
        &conn,
        None,
        Some(&username),
        "register",
        Some(user_id),
        Some("User registered (via auth_register)"),
    );

    // Return created user public view
    if let Some(u) = get_user_by_id_row(&conn, user_id)? {
        return Ok(UserPublic {
            id: u.id,
            name: u.name,
            username: u.username,
            email: u.email,
            role: u.role,
            created_at: u.created_at,
            last_login: u.last_login,
        });
    }

    Err("Failed to fetch created user".into())
}

/// Login: returns (UserPublic, session_token)
#[command]
pub fn auth_login(
    _app: AppHandle,
    username: String,
    password: String,
    ip: Option<String>,
) -> Result<(UserPublic, String), String> {
    if username.trim().is_empty() || password.trim().is_empty() {
        return Err("Username and password are required.".into());
    }

    let conn = crate::db::open_connection()?;
    init_db_schema(&conn)?;

    // brute-force protection: last 5 minutes window
    let recent_failed =
        crate::db::count_recent_failed_logins(&conn, &username, 60 * 5).unwrap_or(0);
    if recent_failed > 10 {
        let _ = insert_audit_log(
            &conn,
            None,
            Some(&username),
            "login_rate_limited",
            None,
            Some("Too many failed logins"),
        );
        return Err("Too many failed login attempts. Try again later.".into());
    }

    if let Some(user_row) = get_user_by_username_row(&conn, &username)? {
        let ok = verify_password(&user_row.password_hash, &password)?;
        if ok {
            // update last_login timestamp
            update_last_login(&conn, user_row.id)?;

            // create session token (7 days) using the existing db-backed helper
            // session::create_session expects &Connection currently
            let token = session::create_session(&conn, user_row.id, 60 * 60 * 24 * 7)?;

            let _ = insert_audit_log(
                &conn,
                Some(user_row.id),
                Some(&user_row.username),
                "login_success",
                Some(user_row.id),
                Some("User logged in"),
            );

            let _ = insert_login_history(
                &conn,
                Some(user_row.id),
                &user_row.username,
                true,
                ip.as_deref(),
            );

            let user_public = UserPublic {
                id: user_row.id,
                name: user_row.name,
                username: user_row.username.clone(),
                email: user_row.email.clone(),
                role: user_row.role.clone(),
                created_at: user_row.created_at,
                last_login: user_row.last_login,
            };
            return Ok((user_public, token));
        } else {
            // failed password
            let _ = insert_failed_login(&conn, &username, ip.as_deref());
            let _ = insert_login_history(
                &conn,
                Some(user_row.id),
                &user_row.username,
                false,
                ip.as_deref(),
            );
            let _ = insert_audit_log(
                &conn,
                Some(user_row.id),
                Some(&user_row.username),
                "login_failed",
                None,
                Some("Invalid password"),
            );
            return Err("Invalid username or password".into());
        }
    } else {
        // unknown username
        let _ = insert_failed_login(&conn, &username, ip.as_deref());
        let _ = insert_login_history(&conn, None, &username, false, ip.as_deref());
        let _ = insert_audit_log(
            &conn,
            None,
            Some(&username),
            "login_failed",
            None,
            Some("Unknown username"),
        );
        return Err("Invalid username or password".into());
    }
}

/// Logout: revoke session token
#[command]
pub fn auth_logout(_app: AppHandle, session_token: String) -> Result<bool, String> {
    let conn = crate::db::open_connection()?;
    init_db_schema(&conn)?;

    if let Some((_t, user_id, _)) = get_session(&conn, &session_token)? {
        session::revoke_session_token(&conn, &session_token)?;
        let _ = insert_audit_log(
            &conn,
            Some(user_id),
            None,
            "logout",
            Some(user_id),
            Some("User logged out"),
        );
        return Ok(true);
    }
    Err("Invalid session".into())
}

/// Validate session token and return UserPublic
#[command]
pub fn validate_session(_app: AppHandle, session_token: String) -> Result<UserPublic, String> {
    let conn = crate::db::open_connection()?;
    init_db_schema(&conn)?;

    if let Some((_t, user_id, expires_opt)) = get_session(&conn, &session_token)? {
        if let Some(expires) = expires_opt {
            if chrono::Utc::now().timestamp() > expires {
                return Err("Session expired".into());
            }
        }
        if let Some(u) = get_user_by_id_row(&conn, user_id)? {
            return Ok(UserPublic {
                id: u.id,
                name: u.name,
                username: u.username,
                email: u.email,
                role: u.role,
                created_at: u.created_at,
                last_login: u.last_login,
            });
        }
    }
    Err("Invalid session".into())
}

/// Get profile by session (convenience wrapper that uses session::validate_session)
#[command]
pub fn get_profile_by_session(_app: AppHandle, session_token: String) -> Result<UserPublic, String> {
    let conn = crate::db::open_connection()?;
    init_db_schema(&conn)?;

    if let Some(uid) = session::validate_session(&conn, &session_token)? {
        if let Some(u) = get_user_by_id_row(&conn, uid)? {
            return Ok(UserPublic {
                id: u.id,
                name: u.name,
                username: u.username,
                email: u.email,
                role: u.role,
                created_at: u.created_at,
                last_login: u.last_login,
            });
        }
    }
    Err("Invalid session".into())
}
