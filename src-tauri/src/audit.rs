// src-tauri/src/audit.rs
use chrono::{Duration, Utc};
use rusqlite::Connection;
use serde::Serialize;
use tauri::{command, AppHandle};

/// This file expects these helpers in your project:
/// - crate::db::open_connection()
/// - crate::db::init_db_schema(&Connection)
/// - crate::db::insert_audit_log(&Connection, Option<i64>, Option<&str>, &str, Option<&str>, Option<&str>)
/// - crate::db::get_user_by_id_row(&Connection, i64) -> Option<UserRow>
/// - crate::session::validate_session(&Connection, &str) -> Option<i64>
///
/// If names differ adapt accordingly.

fn pick_session_token(
    session_token: Option<String>,
    sessionToken: Option<String>,
) -> Option<String> {
    sessionToken.or(session_token)
}

fn ensure_admin_session(
    conn: &Connection,
    token_opt: Option<String>,
    token_opt2: Option<String>,
) -> Result<(i64, String), String> {
    let token =
        pick_session_token(token_opt, token_opt2).ok_or("missing session token".to_string())?;
    if let Some(uid) = crate::session::validate_session(conn, &token)? {
        if let Some(user_row) = crate::db::get_user_by_id_row(conn, uid)? {
            if user_row.role == "admin" {
                return Ok((user_row.id, user_row.username.clone()));
            } else {
                return Err("Admin privileges required".into());
            }
        }
    }
    Err("Invalid session".into())
}

#[command]
pub fn admin_list_audit_logs(
    _app: AppHandle,
    sessionToken: Option<String>,
    session_token: Option<String>,
    limit: Option<i64>,
) -> Result<
    Vec<(
        i64,
        Option<i64>,
        Option<String>,
        String,
        Option<i64>,
        Option<String>,
        i64,
    )>,
    String,
> {
    let conn = crate::db::open_connection().map_err(|e| format!("open db: {}", e))?;
    crate::db::init_db_schema(&conn).map_err(|e| format!("init schema: {}", e))?;

    // ensure admin
    let (admin_id, admin_username) =
        ensure_admin_session(&conn, session_token.clone(), sessionToken.clone())?;
    let l = limit.unwrap_or(200);

    // delete index_start entries before listing
    let _ = conn.execute("DELETE FROM audit_logs WHERE action = 'index_start'", []);

    // select using your schema: created_at, actor_username, action, target_user_id, details
    let mut stmt = conn
        .prepare(
            "SELECT id, actor_user_id, actor_username, action, target_user_id, details, created_at
         FROM audit_logs
         ORDER BY created_at DESC
         LIMIT ?1",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([l], |r| {
            Ok((
                r.get::<_, i64>(0)?,                       // id
                r.get::<_, Option<i64>>(1)?,               // actor_user_id
                r.get::<_, Option<String>>(2)?,            // actor_username
                r.get::<_, String>(3).unwrap_or_default(), // action
                r.get::<_, Option<i64>>(4)?,               // target_user_id
                r.get::<_, Option<String>>(5)?,            // details
                r.get::<_, i64>(6).unwrap_or(0),           // created_at
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for row in rows {
        out.push(row.map_err(|e| e.to_string())?);
    }

    let _ = crate::db::insert_audit_log(
        &conn,
        Some(admin_id),
        Some(&admin_username),
        "admin_list_audit_logs",
        None,
        Some(&format!("Listed last {} audit entries", out.len())),
    );

    Ok(out)
}

#[derive(Serialize)]
pub struct PortalLog {
    pub id: i64,
    pub time: i64,            // created_at
    pub user: Option<String>, // actor_username
    pub event: String,        // action
    pub target_user_id: Option<i64>,
    pub details: Option<String>,
}

fn window_to_ts(window: &str) -> i64 {
    let now = Utc::now();
    match window {
        "48h" => (now - Duration::hours(48)).timestamp(),
        "1w" => (now - Duration::days(7)).timestamp(),
        "1m" => (now - Duration::days(30)).timestamp(),
        "1y" => (now - Duration::days(365)).timestamp(),
        _ => (now - Duration::hours(24)).timestamp(), // default 24h
    }
}

/// Returns portal activity: logins/registers/logout + user-targeted actions.
#[command]
pub fn get_portal_audit_logs(
    _app: AppHandle,
    sessionToken: Option<String>,
    session_token: Option<String>,
    window: Option<String>,
    limit: Option<i64>,
) -> Result<Vec<PortalLog>, String> {
    let conn = crate::db::open_connection().map_err(|e| format!("open db: {}", e))?;
    crate::db::init_db_schema(&conn).map_err(|e| format!("init schema: {}", e))?;

    let (admin_id, admin_username) =
        ensure_admin_session(&conn, session_token.clone(), sessionToken.clone())?;
    let l = limit.unwrap_or(200);
    let win = window.unwrap_or_else(|| "24h".to_string());
    let since_ts = window_to_ts(&win);

    // delete index_start entries before listing
    let _ = conn.execute("DELETE FROM audit_logs WHERE action = 'index_start'", []);

    // Portal: either a user-targeted action OR common auth actions
    let mut stmt = conn.prepare(
        "SELECT id, actor_username, action, target_user_id, details, created_at
         FROM audit_logs
         WHERE created_at >= ?1
           AND (target_user_id IS NOT NULL OR action IN ('login_success','login_failed','register','logout'))
         ORDER BY created_at DESC
         LIMIT ?2"
    ).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([since_ts, l], |r| {
            Ok(PortalLog {
                id: r.get(0)?,
                user: r.get::<_, Option<String>>(1)?,
                event: r.get::<_, String>(2)?,
                target_user_id: r.get::<_, Option<i64>>(3)?,
                details: r.get::<_, Option<String>>(4)?,
                time: r.get::<_, i64>(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }

    let _ = crate::db::insert_audit_log(
        &conn,
        Some(admin_id),
        Some(&admin_username),
        "admin_list_portal_audit",
        None,
        Some(&format!("Listed {} portal audit rows", out.len())),
    );

    Ok(out)
}

#[derive(Serialize)]
pub struct WatchlistAttempt {
    pub id: i64,
    pub time: i64,
    pub user: Option<String>,
    pub op: String,
    pub path_or_target: Option<String>,
    pub reason: Option<String>,
    pub details: Option<String>,
}

/// Heuristic: look for blocked/fs-prefixed actions, or explicit file-op words in action.
/// If you record file-target columns in future (e.g. target_file_path), adapt this query.
#[command]
pub fn get_watchlist_blocked_attempts(
    _app: AppHandle,
    sessionToken: Option<String>,
    session_token: Option<String>,
    window: Option<String>,
    limit: Option<i64>,
) -> Result<Vec<WatchlistAttempt>, String> {
    let conn = crate::db::open_connection().map_err(|e| format!("open db: {}", e))?;
    crate::db::init_db_schema(&conn).map_err(|e| format!("init schema: {}", e))?;

    let (admin_id, admin_username) =
        ensure_admin_session(&conn, session_token.clone(), sessionToken.clone())?;
    let l = limit.unwrap_or(200);
    let win = window.unwrap_or_else(|| "24h".to_string());
    let since_ts = window_to_ts(&win);

    // Optionally delete index_start entries
    let _ = conn.execute("DELETE FROM audit_logs WHERE action = 'index_start'", []);

    // search for patterns; adapt if you use different action names for blocked ops
    let mut stmt = conn
        .prepare(
            "SELECT id, actor_username, action, details, created_at
         FROM audit_logs
         WHERE created_at >= ?1
           AND (
               action LIKE '%_blocked'
               OR action LIKE 'fs_%'
               OR action LIKE '%delete%'
               OR action LIKE '%rename%'
               OR action LIKE '%move%'
               OR action LIKE '%copy%'
           )
         ORDER BY created_at DESC
         LIMIT ?2",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([since_ts, l], |r| {
            let details: Option<String> = r.get(3)?;
            // path/reason may be embedded in details; frontend will parse if JSON
            Ok(WatchlistAttempt {
                id: r.get(0)?,
                user: r.get::<_, Option<String>>(1)?,
                op: r.get::<_, String>(2)?,
                path_or_target: details.clone(),
                reason: details.clone(),
                details,
                time: r.get::<_, i64>(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }

    let _ = crate::db::insert_audit_log(
        &conn,
        Some(admin_id),
        Some(&admin_username),
        "admin_list_watchlist_blocked_attempts",
        None,
        Some(&format!("Listed {} watchlist rows", out.len())),
    );

    Ok(out)
}
