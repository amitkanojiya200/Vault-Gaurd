// src-tauri/src/user_backend.rs  (append or merge)
use chrono::Utc;
use rusqlite::Connection;
use serde::Serialize;
use tauri::command;

#[derive(Serialize)]
pub struct UserPublic {
    pub id: i64,
    pub name: String,
    pub username: String,
    pub email: Option<String>,
    pub role: String,
    pub created_at: i64,
    pub last_login: Option<i64>,
}

/// Helper: require session to belong to an admin
fn ensure_admin_session(conn: &Connection, session_token: &str) -> Result<(i64, String), String> {
    if let Some(uid) = crate::session::validate_session(conn, session_token)? {
        if let Some(u) = crate::db::get_user_by_id_row(conn, uid)? {
            if u.role == "admin" {
                return Ok((u.id, u.username.clone()));
            } else {
                return Err("Admin privileges required".into());
            }
        }
    }
    Err("Invalid session".into())
}

/// Update profile for the currently authenticated user (by session_token).
/// Any of new_name/new_username/new_password may be null (None) -> update only provided ones.
/// Returns updated UserPublic on success.
#[command]
pub fn update_profile_by_session(
    session_token: String,
    new_name: Option<String>,
    new_username: Option<String>,
    new_password: Option<String>,
) -> Result<UserPublic, String> {
    let conn = crate::db::open_connection()?;
    crate::db::init_db_schema(&conn)?;

    // Validate session -> get user id
    let uid = crate::session::validate_session(&conn, &session_token)?
        .ok_or_else(|| "Invalid session token".to_string())?;

    // If username change requested, ensure uniqueness (unless same as current)
    if let Some(ref uname) = new_username {
        if let Some(existing) = crate::db::get_user_by_username_row(&conn, uname)? {
            // if `existing.id != uid` then username taken
            if existing.id != uid {
                return Err("Username already in use".into());
            }
        }
    }

    // If password change requested, hash it
    let password_hash_opt = if let Some(pw) = new_password {
        // Use your security helper to hash
        let hashed =
            crate::security::hash_password(&pw).map_err(|e| format!("hash error: {}", e))?;
        Some(hashed)
    } else {
        None
    };

    // If username change requested we must update username too.
    // We use an UPDATE with optional columns.
    {
        // Build params dynamically
        let mut sql = String::from("UPDATE users SET ");
        let mut updates: Vec<String> = vec![];
        let mut params_vec: Vec<rusqlite::types::Value> = vec![];

        if let Some(ref n) = new_name {
            updates.push("name = ?".into());
            params_vec.push(rusqlite::types::Value::from(n.clone()));
        }
        if let Some(ref u) = new_username {
            updates.push("username = ?".into());
            params_vec.push(rusqlite::types::Value::from(u.clone()));
        }
        if let Some(ref ph) = password_hash_opt {
            updates.push("password_hash = ?".into());
            params_vec.push(rusqlite::types::Value::from(ph.clone()));
        }

        if !updates.is_empty() {
            sql.push_str(&updates.join(", "));
            sql.push_str(" WHERE id = ?");
            params_vec.push(rusqlite::types::Value::from(uid));
            // Execute
            let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
            stmt.execute(rusqlite::params_from_iter(params_vec))
                .map_err(|e| e.to_string())?;
        }
    }

    // return updated user pub
    if let Some(u) = crate::db::get_user_by_id_row(&conn, uid)? {
        Ok(UserPublic {
            id: u.id,
            name: u.name,
            username: u.username,
            email: u.email,
            role: u.role,
            created_at: u.created_at,
            last_login: u.last_login,
        })
    } else {
        Err("Failed to fetch updated user".into())
    }
}

// ------------------- Admin commands -------------------

#[command]
pub fn admin_can_list_users_cmd(
    _app: tauri::AppHandle,
    session_token: String,
) -> Result<Vec<UserPublic>, String> {
    let conn = crate::db::open_connection()?;
    crate::db::init_db_schema(&conn)?;
    let (_admin_id, _admin_username) = ensure_admin_session(&conn, &session_token)?;
    let rows = crate::db::list_users_public(&conn).map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for (id, name, username, email, role, created_at, last_login) in rows {
        out.push(UserPublic {
            id,
            name,
            username,
            email,
            role,
            created_at,
            last_login,
        });
    }
    Ok(out)
}

#[command]
pub fn admin_can_create_user_cmd(
    _app: tauri::AppHandle,
    session_token: String,
    name: String,
    username: String,
    email: Option<String>,
    password: String,
    role: String,
) -> Result<UserPublic, String> {
    let conn = crate::db::open_connection()?;
    crate::db::init_db_schema(&conn)?;
    let (_admin_id, _admin_username) = ensure_admin_session(&conn, &session_token)?;

    // check username uniqueness
    if let Some(_) = crate::db::get_user_by_username_row(&conn, &username)? {
        return Err("Username already exists".into());
    }

    // hash password
    let hash =
        crate::security::hash_password(&password).map_err(|e| format!("hash error: {}", e))?;
    let created = crate::db::insert_user(&conn, &name, &username, email.as_deref(), &hash, &role)
        .map_err(|e| e.to_string())?;

    Ok(UserPublic {
        id: created.id,
        name: created.name,
        username: created.username,
        email: created.email,
        role: created.role,
        created_at: created.created_at,
        last_login: created.last_login,
    })
}

#[command]
pub fn admin_can_update_user_cmd(
    _app: tauri::AppHandle,
    session_token: String,
    id: i64,
    name: String,
    username: String,
    email: Option<String>,
    password: Option<String>,
    role: String,
) -> Result<UserPublic, String> {
    let conn = crate::db::open_connection()?;
    crate::db::init_db_schema(&conn)?;
    let (_admin_id, _admin_username) = ensure_admin_session(&conn, &session_token)?;

    // If updating username, ensure it is not taken by another user
    if let Some(urow) = crate::db::get_user_by_username_row(&conn, &username)? {
        if urow.id != id {
            return Err("Username already in use".into());
        }
    }

    let phash = if let Some(pw) = password {
        Some(crate::security::hash_password(&pw).map_err(|e| e.to_string())?)
    } else {
        None
    };

    crate::db::admin_update_user_full(
        &conn,
        id,
        &name,
        &username,
        email.as_deref(),
        phash.as_deref(),
        &role,
    )
    .map_err(|e| e.to_string())?;

    // return updated user
    if let Some(u) = crate::db::get_user_by_id_row(&conn, id)? {
        Ok(UserPublic {
            id: u.id,
            name: u.name,
            username: u.username,
            email: u.email,
            role: u.role,
            created_at: u.created_at,
            last_login: u.last_login,
        })
    } else {
        Err("Failed to fetch updated user".into())
    }
}

#[command]
pub fn admin_can_delete_user_cmd(
    _app: tauri::AppHandle,
    session_token: String,
    id: i64,
) -> Result<bool, String> {
    let conn = crate::db::open_connection()?;
    crate::db::init_db_schema(&conn)?;
    let (admin_id, _admin_username) = ensure_admin_session(&conn, &session_token)?;

    // Optionally prevent admin deleting themselves
    if admin_id == id {
        // allow if you want to permit self-delete; safer to disallow
        return Err("Admin cannot delete their own account".into());
    }

    crate::db::admin_delete_user(&conn, id).map_err(|e| e.to_string())?;
    Ok(true)
}
