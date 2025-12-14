// src-tauri/src/admin_backend.rs
use rusqlite::params;
use serde::Serialize;
use tauri::{command, AppHandle};

use crate::db::{
    admin_delete_user, admin_update_user_full, get_user_by_id_row, get_user_by_username_row,
    insert_audit_log, insert_user_full, list_users_public,
    open_connection, /* keep for compatibility if needed */
};
use crate::security::hash_password;

/// Public view of a user (no password hash).
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

/// Ensure session token belongs to an admin; return (admin_id, admin_username)
fn ensure_admin(conn: &rusqlite::Connection, session_token: &str) -> Result<(i64, String), String> {
    // session.validate_session returns Option<user_id>
    if let Some(uid) = crate::session::validate_session(conn, session_token)? {
        if let Some(user_row) = get_user_by_id_row(conn, uid)? {
            if user_row.role == "admin" {
                return Ok((user_row.id, user_row.username.clone()));
            }
        }
    }
    Err("Admin session required".into())
}

////////////////////////////////////////////////////////////////////////////////
// Commands (AppHandle-aware)
////////////////////////////////////////////////////////////////////////////////

#[command]
pub fn admin_list_users_cmd(
    session_token: String,
    _app: AppHandle,
) -> Result<Vec<UserPublic>, String> {
    // open DB via app-aware helper (open_connection_app should be implemented in db.rs)
    let conn = crate::db::open_connection()?;
    // ensure schema exists (safe)
    crate::db::init_db_schema(&conn)?;

    let (admin_id, admin_username) = ensure_admin(&conn, &session_token)?;

    // use existing db helper to fetch public list
    let rows = list_users_public(&conn)?;
    let out = rows
        .into_iter()
        .map(
            |(id, name, username, email_opt, role, created_at, last_login)| UserPublic {
                id,
                name,
                username,
                email: email_opt,
                role,
                created_at,
                last_login,
            },
        )
        .collect::<Vec<_>>();

    let _ = insert_audit_log(
        &conn,
        Some(admin_id),
        Some(&admin_username),
        "admin_list_users",
        None,
        Some("Listed users"),
    );

    Ok(out)
}

#[command]
pub fn admin_get_user_cmd(
    _app: AppHandle,
    session_token: String,
    target_id: i64,
) -> Result<UserPublic, String> {
    let conn = crate::db::open_connection()?;
    crate::db::init_db_schema(&conn)?;

    let (admin_id, admin_username) = ensure_admin(&conn, &session_token)?;
    if let Some(u) = get_user_by_id_row(&conn, target_id)? {
        let _ = insert_audit_log(
            &conn,
            Some(admin_id),
            Some(&admin_username),
            "admin_get_user",
            Some(target_id),
            Some("Fetched user details"),
        );
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
    Err("User not found".into())
}

#[command]
pub fn admin_create_user_cmd(
    _app: AppHandle,
    session_token: String,
    name: String,
    username: String,
    email: Option<String>,
    password: String,
    role: String,
) -> Result<UserPublic, String> {
    let conn = crate::db::open_connection()?;
    crate::db::init_db_schema(&conn)?;

    let (admin_id, admin_username) = ensure_admin(&conn, &session_token)?;

    // validate
    if name.trim().is_empty() || username.trim().is_empty() || password.trim().is_empty() {
        return Err("All fields required".into());
    }
    if username.len() < 3 || password.len() < 6 {
        return Err("Username >=3 and password >=6 chars".into());
    }

    // uniqueness check using get_user_by_username_row
    if let Some(_) = get_user_by_username_row(&conn, &username)? {
        return Err("Username already exists".into());
    }

    // hash & insert
    let ph = hash_password(&password)?;
    let new_id = insert_user_full(&conn, &name, &username, email.as_deref(), &ph, &role)?;

    let _ = insert_audit_log(
        &conn,
        Some(admin_id),
        Some(&admin_username),
        "admin_create_user",
        Some(new_id),
        Some(&format!("Created user '{}', role={}", username, role)),
    );

    // return created user
    if let Some(u) = get_user_by_id_row(&conn, new_id)? {
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

#[command]
pub fn admin_update_user_cmd(
    _app: AppHandle,
    session_token: String,
    id: i64,
    name: Option<String>,
    username: Option<String>,
    email: Option<String>,
    password: Option<String>,
    role: Option<String>,
) -> Result<UserPublic, String> {
    let conn = crate::db::open_connection()?;
    crate::db::init_db_schema(&conn)?;

    let (admin_id, admin_username) = ensure_admin(&conn, &session_token)?;

    // fetch target
    let target = get_user_by_id_row(&conn, id)?.ok_or("User not found")?;

    // handle username uniqueness if changed
    if let Some(ref new_username) = username {
        if new_username != &target.username {
            if let Some(_) = get_user_by_username_row(&conn, new_username)? {
                return Err("Username already exists".into());
            }
        }
    }

    let final_name = name.unwrap_or(target.name.clone());
    let final_username = username.unwrap_or(target.username.clone());
    let final_email = if email.as_deref() == target.email.as_deref() {
        target.email.clone()
    } else {
        email.clone()
    };
    let final_role = role.unwrap_or(target.role.clone());
    let ph_opt = if let Some(pw) = password {
        Some(hash_password(&pw)?)
    } else {
        None
    };

    // reuse db helper admin_update_user_full to do the heavy work
    admin_update_user_full(
        &conn,
        id,
        &final_name,
        &final_username,
        final_email.as_deref(),
        ph_opt.as_deref(),
        &final_role,
    )?;

    let _ = insert_audit_log(
        &conn,
        Some(admin_id),
        Some(&admin_username),
        "admin_update_user",
        Some(id),
        Some(&format!(
            "Updated user id={} username={}",
            id, final_username
        )),
    );

    let updated = get_user_by_id_row(&conn, id)?.ok_or("User not found after update")?;
    Ok(UserPublic {
        id: updated.id,
        name: updated.name,
        username: updated.username,
        email: updated.email,
        role: updated.role,
        created_at: updated.created_at,
        last_login: updated.last_login,
    })
}

#[command]
pub fn admin_delete_user_cmd(_app: AppHandle, session_token: String, id: i64) -> Result<(), String> {
    let conn = crate::db::open_connection()?;
    crate::db::init_db_schema(&conn)?;

    let (admin_id, admin_username) = ensure_admin(&conn, &session_token)?;

    // ensure the user exists
    let target = get_user_by_id_row(&conn, id)?.ok_or("User not found")?;

    // guard: do not allow deleting last admin or self — implement your policy here
    if target.role == "admin" && target.id == admin_id {
        return Err("Cannot delete own admin account".into());
    }

    // delete using db helper
    admin_delete_user(&conn, id)?;

    let _ = insert_audit_log(
        &conn,
        Some(admin_id),
        Some(&admin_username),
        "admin_delete_user",
        Some(id),
        Some(&format!("Deleted user '{}'", target.username)),
    );

    Ok(())
}
