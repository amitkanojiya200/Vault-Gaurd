// src-tauri/src/db.rs
use chrono::Utc;
use rusqlite::{params, Connection, OpenFlags};
use std::fs;
use std::path::PathBuf;
use std::result::Result;
use uuid::Uuid;

// Normalize path helper
fn normalize_path(p: &str) -> String {
    p.replace('\\', "/")
}
// use dirs-next to locate OS-specific app data directory
fn app_data_dir() -> Result<PathBuf, String> {
    // prefer local data dir (Windows: %LOCALAPPDATA%, Linux: $XDG_DATA_HOME, macOS: ~/Library/Application Support)
    if let Some(mut p) = dirs_next::data_local_dir() {
        p.push("vaultguard");
        fs::create_dir_all(&p).map_err(|e| format!("Failed to create data dir {:?}: {}", p, e))?;
        p.push("vaultguard.sqlite");
        Ok(p)
    } else if let Some(mut p) = dirs_next::data_dir() {
        // fallback to generic data_dir
        p.push("vaultguard");
        fs::create_dir_all(&p).map_err(|e| format!("Failed to create data dir {:?}: {}", p, e))?;
        p.push("vaultguard.sqlite");
        Ok(p)
    } else {
        Err(
            "Could not resolve an OS app data directory. Please ensure environment is standard."
                .into(),
        )
    }
}

/// Open a rusqlite Connection (create file if missing)
pub fn open_connection() -> Result<Connection, String> {
    let p = app_data_dir()?;
    let flags = OpenFlags::SQLITE_OPEN_READ_WRITE
        | OpenFlags::SQLITE_OPEN_CREATE
        | OpenFlags::SQLITE_OPEN_FULL_MUTEX;
    Connection::open_with_flags(p, flags).map_err(|e| e.to_string())
}

// -----------------------------------------------------------------------------
// Rest of DB code — identical to your earlier implementation but using open_connection()
// -----------------------------------------------------------------------------

#[derive(Debug, Clone)]
pub struct UserRow {
    pub id: i64,
    pub name: String,
    pub username: String,
    pub email: Option<String>,
    pub password_hash: String,
    pub role: String,
    pub created_at: i64,
    pub last_login: Option<i64>,
}

#[derive(Debug, Clone)]
pub struct CreatedUser {
    pub id: i64,
    pub name: String,
    pub username: String,
    pub email: Option<String>,
    pub role: String,
    pub created_at: i64,
    pub last_login: Option<i64>,
}

pub fn init_db_schema(conn: &Connection) -> Result<(), String> {
    let sql = r#"
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      email TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at INTEGER NOT NULL,
      last_login INTEGER
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id INTEGER,
      actor_username TEXT,
      action TEXT NOT NULL,
      target_user_id INTEGER,
      details TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(target_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS failed_logins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      ip TEXT,
      attempted_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS login_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      success INTEGER NOT NULL,
      ip TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS file_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  tag TEXT NOT NULL,
  created_by INTEGER,
  created_at INTEGER,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS recent_access (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  path TEXT NOT NULL,
  accessed_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

    "#;

    conn.execute_batch(sql).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn init_db() -> Result<Connection, String> {
    let conn = open_connection()?;
    init_db_schema(&conn)?;
    Ok(conn)
}

pub fn insert_user_full(
    conn: &Connection,
    name: &str,
    username: &str,
    email: Option<&str>,
    password_hash: &str,
    role: &str,
) -> Result<i64, String> {
    let now = Utc::now().timestamp();
    conn.execute(
        "INSERT INTO users (name, username, email, password_hash, role, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![name, username, email, password_hash, role, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

pub fn get_user_by_username_row(
    conn: &Connection,
    username: &str,
) -> Result<Option<UserRow>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, name, username, email, password_hash, role, created_at, last_login FROM users WHERE username = ?1",
    ).map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![username]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        Ok(Some(UserRow {
            id: row.get(0).map_err(|e| e.to_string())?,
            name: row.get(1).map_err(|e| e.to_string())?,
            username: row.get(2).map_err(|e| e.to_string())?,
            email: row.get(3).ok(),
            password_hash: row.get(4).map_err(|e| e.to_string())?,
            role: row.get(5).map_err(|e| e.to_string())?,
            created_at: row.get(6).map_err(|e| e.to_string())?,
            last_login: row.get(7).ok(),
        }))
    } else {
        Ok(None)
    }
}

pub fn get_user_by_id_row(conn: &Connection, id: i64) -> Result<Option<UserRow>, String> {
    let mut stmt = conn.prepare(
        "SELECT id, name, username, email, password_hash, role, created_at, last_login FROM users WHERE id = ?1",
    ).map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![id]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        Ok(Some(UserRow {
            id: row.get(0).map_err(|e| e.to_string())?,
            name: row.get(1).map_err(|e| e.to_string())?,
            username: row.get(2).map_err(|e| e.to_string())?,
            email: row.get(3).ok(),
            password_hash: row.get(4).map_err(|e| e.to_string())?,
            role: row.get(5).map_err(|e| e.to_string())?,
            created_at: row.get(6).map_err(|e| e.to_string())?,
            last_login: row.get(7).ok(),
        }))
    } else {
        Ok(None)
    }
}

pub fn list_users_public(
    conn: &Connection,
) -> Result<
    Vec<(
        i64,
        String,
        String,
        Option<String>,
        String,
        i64,
        Option<i64>,
    )>,
    String,
> {
    let mut stmt = conn.prepare("SELECT id, name, username, email, role, created_at, last_login FROM users ORDER BY id ASC").map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        out.push((
            row.get(0).map_err(|e| e.to_string())?,
            row.get(1).map_err(|e| e.to_string())?,
            row.get(2).map_err(|e| e.to_string())?,
            row.get(3).ok(),
            row.get(4).map_err(|e| e.to_string())?,
            row.get(5).map_err(|e| e.to_string())?,
            row.get(6).ok(),
        ));
    }
    Ok(out)
}

pub fn admin_update_user_full(
    conn: &Connection,
    id: i64,
    name: &str,
    username: &str,
    email: Option<&str>,
    password_hash: Option<&str>,
    role: &str,
) -> Result<(), String> {
    if let Some(ph) = password_hash {
        conn.execute("UPDATE users SET name = ?1, username = ?2, email = ?3, password_hash = ?4, role = ?5 WHERE id = ?6", params![name, username, email, ph, role, id]).map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "UPDATE users SET name = ?1, username = ?2, email = ?3, role = ?4 WHERE id = ?5",
            params![name, username, email, role, id],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn admin_delete_user(conn: &Connection, id: i64) -> Result<(), String> {
    conn.execute("DELETE FROM users WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn update_last_login(conn: &Connection, user_id: i64) -> Result<(), String> {
    let now = Utc::now().timestamp();
    conn.execute(
        "UPDATE users SET last_login = ?1 WHERE id = ?2",
        params![now, user_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn create_session_token(
    conn: &Connection,
    user_id: i64,
    ttl_seconds: Option<i64>,
) -> Result<String, String> {
    let token = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp();
    let expires_at = ttl_seconds.map(|ttl| now + ttl);
    conn.execute(
        "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)",
        params![token, user_id, now, expires_at],
    )
    .map_err(|e| e.to_string())?;
    Ok(token)
}

pub fn get_session(
    conn: &Connection,
    token: &str,
) -> Result<Option<(String, i64, Option<i64>)>, String> {
    let mut stmt = conn
        .prepare("SELECT token, user_id, expires_at FROM sessions WHERE token = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![token]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        Ok(Some((
            row.get(0).map_err(|e| e.to_string())?,
            row.get(1).map_err(|e| e.to_string())?,
            row.get(2).ok(),
        )))
    } else {
        Ok(None)
    }
}

pub fn revoke_session(conn: &Connection, token: &str) -> Result<(), String> {
    conn.execute("DELETE FROM sessions WHERE token = ?1", params![token])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn insert_audit_log(
    conn: &Connection,
    actor_user_id: Option<i64>,
    actor_username: Option<&str>,
    action: &str,
    target_user_id: Option<i64>,
    details: Option<&str>,
) -> Result<i64, String> {
    let now = Utc::now().timestamp();
    conn.execute("INSERT INTO audit_logs (actor_user_id, actor_username, action, target_user_id, details, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)", params![actor_user_id, actor_username, action, target_user_id, details, now]).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

pub fn list_audit_logs(
    conn: &Connection,
    limit: i64,
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
    let mut stmt = conn.prepare("SELECT id, actor_user_id, actor_username, action, target_user_id, details, created_at FROM audit_logs ORDER BY created_at DESC LIMIT ?1").map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![limit]).map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        out.push((
            row.get(0).map_err(|e| e.to_string())?,
            row.get(1).ok(),
            row.get(2).ok(),
            row.get(3).map_err(|e| e.to_string())?,
            row.get(4).ok(),
            row.get(5).ok(),
            row.get(6).map_err(|e| e.to_string())?,
        ));
    }
    Ok(out)
}

pub fn insert_failed_login(
    conn: &Connection,
    username: &str,
    ip: Option<&str>,
) -> Result<i64, String> {
    let now = Utc::now().timestamp();
    conn.execute(
        "INSERT INTO failed_logins (username, ip, attempted_at) VALUES (?1, ?2, ?3)",
        params![username, ip, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

pub fn count_recent_failed_logins(
    conn: &Connection,
    username: &str,
    window_seconds: i64,
) -> Result<i64, String> {
    let since = Utc::now().timestamp() - window_seconds;
    let mut stmt = conn
        .prepare("SELECT COUNT(*) FROM failed_logins WHERE username = ?1 AND attempted_at >= ?2")
        .map_err(|e| e.to_string())?;
    let count: i64 = stmt
        .query_row(params![username, since], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    Ok(count)
}

pub fn insert_login_history(
    conn: &Connection,
    user_id: Option<i64>,
    username: &str,
    success: bool,
    ip: Option<&str>,
) -> Result<i64, String> {
    let now = Utc::now().timestamp();
    conn.execute("INSERT INTO login_history (user_id, username, success, ip, created_at) VALUES (?1, ?2, ?3, ?4, ?5)", params![user_id, username, if success {1} else {0}, ip, now]).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

pub fn insert_user(
    conn: &Connection,
    name: &str,
    username: &str,
    email: Option<&str>,
    password_hash: &str,
    role: &str,
) -> Result<CreatedUser, String> {
    let id = insert_user_full(conn, name, username, email, password_hash, role)?;
    if let Some(u) = get_user_by_id_row(conn, id)? {
        Ok(CreatedUser {
            id: u.id,
            name: u.name,
            username: u.username,
            email: u.email,
            role: u.role,
            created_at: u.created_at,
            last_login: u.last_login,
        })
    } else {
        Err("Failed to fetch created user".into())
    }
}

pub fn get_files_per_drive(
    conn: &Connection,
    limit: Option<i64>,
) -> Result<Vec<(String, i64)>, rusqlite::Error> {
    let sql = "SELECT COALESCE(drive, 'unknown') as drive, COUNT(*) as cnt
               FROM files_index
               GROUP BY drive
               ORDER BY cnt DESC
               LIMIT ?1";
    let l = limit.unwrap_or(1000);
    let mut stmt = conn.prepare(sql)?;
    let rows = stmt
        .query_map([l], |r| Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?)))?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

// returns Vec<(drive: String, file_type: String, count: i64)>
pub fn get_indexing_by_drive_and_type(
    conn: &Connection,
    limit: Option<i64>,
) -> Result<Vec<(String, String, i64)>, rusqlite::Error> {
    // Assumes files_index has (drive, file_type)
    let sql = "SELECT COALESCE(drive,'unknown') as drive, COALESCE(file_type,'unknown') as ftype, COUNT(*) as cnt
               FROM files_index
               GROUP BY drive, ftype
               ORDER BY cnt DESC
               LIMIT ?1";
    let l = limit.unwrap_or(1000);
    let mut stmt = conn.prepare(sql)?;
    let rows = stmt
        .query_map([l], |r| {
            Ok((
                r.get::<_, String>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, i64>(2)?,
            ))
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

pub fn get_indexing_by_category_global(
    conn: &Connection,
) -> Result<Vec<(String, i64)>, rusqlite::Error> {
    let sql = r#"
    SELECT category, SUM(cnt) as total
    FROM (
      SELECT
        CASE
          WHEN COALESCE(doc_type, '') = 'dir' THEN 'Dir'
          WHEN lower(COALESCE(doc_type, file_type, '')) IN ('pdf') THEN 'PDF'
          WHEN lower(COALESCE(doc_type, file_type, '')) IN ('doc','docx','odt') THEN 'Docs'
          WHEN lower(COALESCE(doc_type, file_type, '')) IN ('ppt','pptx') THEN 'PPT'
          WHEN lower(COALESCE(doc_type, file_type, '')) IN ('xls','xlsx','csv') THEN 'Sheets'
          WHEN lower(COALESCE(doc_type, file_type, '')) IN ('mp4','mkv','mov','avi','m4v','wmv') THEN 'Videos'
          WHEN lower(COALESCE(doc_type, file_type, '')) IN ('jpg','jpeg','png','gif','bmp','webp','heic','svg','image') THEN 'Images'
          WHEN lower(COALESCE(doc_type, file_type, '')) IN ('txt','log','md','json','xml','yml','yaml') THEN 'Text'
          WHEN lower(COALESCE(doc_type, file_type, '')) IN ('zip','rar','7z','tar','gz','exe','dll','bin','binary','archive') THEN 'Binary/Archive'
          ELSE 'Other'
        END AS category,
        1 AS cnt
      FROM files_index
    ) sub
    GROUP BY category
    ORDER BY total DESC;
    "#;
    let mut stmt = conn.prepare(sql)?;
    let rows = stmt
        .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?)))?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(rows)
}

pub fn upsert_files_index(
    conn: &Connection,
    drive: Option<&str>,
    path: &str,
    name: Option<&str>,
    file_type: Option<&str>,
    size: Option<i64>,
    indexed_at: i64,
) -> Result<i64, String> {
    let p = normalize_path(path);
    conn.execute(
        "INSERT INTO files_index(drive, path, name, file_type, size, indexed_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT(path) DO UPDATE SET
           drive=excluded.drive, name=excluded.name, file_type=excluded.file_type, size=excluded.size, indexed_at=excluded.indexed_at",
        params![drive, p, name, file_type, size, indexed_at],
    )
    .map_err(|e| e.to_string())?;
    let id: i64 = conn
        .query_row(
            "SELECT id FROM files_index WHERE path = ?1",
            params![p],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    Ok(id)
}

/// Search using FTS (requires files_index_fts virtual table in migrations).
pub fn search_files_fts(
    conn: &Connection,
    q: &str,
    limit: i64,
) -> Result<
    Vec<(
        i64,
        String,
        String,
        Option<String>,
        Option<i64>,
        Option<i64>,
    )>,
    String,
> {
    if q.trim().is_empty() {
        return Ok(vec![]);
    }
    let fts_q = format!("{}*", q.replace("'", "''"));
    let mut stmt = conn.prepare(
        "SELECT fi.id, COALESCE(fi.name, substr(fi.path, instr(fi.path, '/') + 1)), fi.path, fi.file_type, fi.size, fi.indexed_at
         FROM files_index fi
         JOIN files_index_fts ft ON fi.id = ft.rowid
         WHERE ft MATCH ?1
         LIMIT ?2",
    ).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![fts_q, limit], |r| {
            Ok((
                r.get::<_, i64>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, Option<String>>(3)?,
                r.get::<_, Option<i64>>(4)?,
                r.get::<_, Option<i64>>(5)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

/// Get immediate children of a directory (only direct children).
/// parent should be normalized path; function will normalize input.
pub fn list_dir_children(
    conn: &Connection,
    parent: &str,
    limit: i64,
) -> Result<
    Vec<(
        i64,
        String,
        String,
        Option<String>,
        Option<i64>,
        Option<i64>,
    )>,
    String,
> {
    let mut parent_norm = normalize_path(parent);
    // remove trailing slash except root forms
    if parent_norm.ends_with('/')
        && parent_norm != "/"
        && !(parent_norm.len() == 3 && parent_norm.chars().nth(1) == Some(':'))
    {
        parent_norm.pop();
    }
    // pattern: parent + '/%'
    let like = format!("{}/%", parent_norm);
    let mut stmt = conn.prepare(
        "SELECT id, COALESCE(name, substr(path, length(?1)+2)), path, file_type, size, indexed_at
         FROM files_index
         WHERE path LIKE ?2
           AND instr(substr(path, length(?1) + 2), '/') = 0
         ORDER BY CASE WHEN file_type = 'dir' THEN 0 ELSE 1 END, name ASC
         LIMIT ?3"
    ).map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![parent_norm, like, limit], |r| {
            Ok((
                r.get::<_, i64>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, Option<String>>(3)?,
                r.get::<_, Option<i64>>(4)?,
                r.get::<_, Option<i64>>(5)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

/// Insert tag for path
pub fn insert_file_tag(
    conn: &Connection,
    path: &str,
    tag: &str,
    created_by: Option<i64>,
) -> Result<i64, String> {
    let p = normalize_path(path);
    let ts = Utc::now().timestamp();
    conn.execute(
        "INSERT INTO file_tags(path, tag, created_by, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![p, tag, created_by, ts],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

/// Remove a tag (by id)
pub fn delete_file_tag_by_id(conn: &Connection, id: i64) -> Result<(), String> {
    conn.execute("DELETE FROM file_tags WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// List tags for a path
pub fn list_tags_for_path(
    conn: &Connection,
    path: &str,
) -> Result<Vec<(i64, String, Option<i64>, Option<i64>)>, String> {
    let p = normalize_path(path);
    let mut stmt = conn.prepare("SELECT id, tag, created_by, created_at FROM file_tags WHERE path = ?1 ORDER BY created_at DESC").map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![p], |r| {
            Ok((
                r.get(0)?,
                r.get(1)?,
                r.get::<_, Option<i64>>(2)?,
                r.get::<_, Option<i64>>(3)?,
            ))
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

/// Record recent access and trim to latest 20 per user (or global if user_id is None).
pub fn record_recent_access(
    conn: &Connection,
    user_id: Option<i64>,
    path: &str,
) -> Result<(), String> {
    let p = normalize_path(path);
    let ts = Utc::now().timestamp();
    conn.execute(
        "INSERT INTO recent_access(user_id, path, accessed_at) VALUES (?1, ?2, ?3)",
        params![user_id, p, ts],
    )
    .map_err(|e| e.to_string())?;
    if let Some(uid) = user_id {
        conn.execute("DELETE FROM recent_access WHERE id IN (SELECT id FROM recent_access WHERE user_id = ?1 ORDER BY accessed_at DESC LIMIT -1 OFFSET 20)", params![uid]).ok();
    } else {
        conn.execute("DELETE FROM recent_access WHERE id IN (SELECT id FROM recent_access WHERE user_id IS NULL ORDER BY accessed_at DESC LIMIT -1 OFFSET 20)", []).ok();
    }
    Ok(())
}

/// Get recent (most recent first)
pub fn get_recent(
    conn: &Connection,
    user_id: Option<i64>,
    limit: i64,
) -> Result<Vec<(String, i64)>, String> {
    let lim = limit;
    if let Some(uid) = user_id {
        let mut stmt = conn.prepare("SELECT path, accessed_at FROM recent_access WHERE user_id = ?1 ORDER BY accessed_at DESC LIMIT ?2").map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![uid, lim], |r| {
                Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?))
            })
            .map_err(|e| e.to_string())?;
        let mut out = Vec::new();
        for r in rows {
            out.push(r.map_err(|e| e.to_string())?);
        }
        Ok(out)
    } else {
        let mut stmt = conn.prepare("SELECT path, accessed_at FROM recent_access WHERE user_id IS NULL ORDER BY accessed_at DESC LIMIT ?1").map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![lim], |r| {
                Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?))
            })
            .map_err(|e| e.to_string())?;
        let mut out = Vec::new();
        for r in rows {
            out.push(r.map_err(|e| e.to_string())?);
        }
        Ok(out)
    }
}
