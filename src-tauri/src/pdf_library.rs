use chrono::Utc;
use rusqlite::params;
use std::fs;
use std::path::PathBuf;

use crate::db;
use crate::db::insert_audit_log;
use crate::session::validate_session;

/// Returned to frontend
#[derive(serde::Serialize)]
pub struct PdfEntry {
    pub id: i64,
    pub title: String,
    pub file_path: String,
    pub uploaded_at: i64,
}

/// Resolve PDF storage dir using DB location (SAFE)
fn pdf_storage_dir() -> Result<PathBuf, String> {
    let mut p = db::get_db_path().map_err(|e| e.to_string())?;
    p.pop(); // remove sqlite filename
    p.push("pdf_library");
    fs::create_dir_all(&p).map_err(|e| e.to_string())?;
    Ok(p)
}

/// LIST PDFs — all authenticated users
#[tauri::command]
pub fn list_pdfs_by_session(
    session_token: String,
    page_key: String,
) -> Result<Vec<PdfEntry>, String> {
    let conn = db::open_connection().map_err(|e| e.to_string())?;
    validate_session(&conn, &session_token)
        .map_err(|e| e.to_string())?
        .ok_or("invalid session")?;

    let mut stmt = conn
        .prepare(
            "SELECT id, title, file_path, uploaded_at
             FROM pdf_library
             WHERE page_key = ?1
             ORDER BY uploaded_at DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![page_key], |r| {
            Ok(PdfEntry {
                id: r.get(0)?,
                title: r.get(1)?,
                file_path: r.get(2)?,
                uploaded_at: r.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

/// ADD PDF — admin only
#[tauri::command]
pub fn add_pdf_by_session(
    session_token: String,
    page_key: String,
    title: String,
    source_path: String,
) -> Result<(), String> {
    let conn = db::open_connection().map_err(|e| e.to_string())?;
    let uid = validate_session(&conn, &session_token)
        .map_err(|e| e.to_string())?
        .ok_or("invalid session")?;

    let user = db::get_user_by_id_row(&conn, uid)
        .map_err(|e| e.to_string())?
        .ok_or("user not found")?;

    if user.role != "admin" {
        return Err("admin role required".into());
    }

    let store = pdf_storage_dir()?;

    // ✅ FIX: bind PathBuf so filename lives long enough
    let source_pb = PathBuf::from(&source_path);
    let filename = source_pb.file_name().ok_or("invalid filename")?;
    let dest = store.join(filename);

    fs::copy(&source_pb, &dest).map_err(|e| e.to_string())?;

    let now = Utc::now().timestamp();
    conn.execute(
        "INSERT INTO pdf_library (page_key, title, file_path, uploaded_by, uploaded_at)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![page_key, title, dest.to_string_lossy(), uid, now],
    )
    .map_err(|e| e.to_string())?;

    insert_audit_log(
        &conn,
        Some(uid),
        Some(&user.username),
        "pdf_add",
        None,
        Some(&title),
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// OPEN PDF — all authenticated users
#[tauri::command]
pub fn open_pdf_by_session(session_token: String, pdf_id: i64) -> Result<(), String> {
    let conn = db::open_connection().map_err(|e| e.to_string())?;
    let uid = validate_session(&conn, &session_token)
        .map_err(|e| e.to_string())?
        .ok_or("invalid session")?;

    let path: String = conn
        .query_row(
            "SELECT file_path FROM pdf_library WHERE id = ?1",
            params![pdf_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    crate::fs_ops::open_file_by_session(session_token, path.clone())?;

    let user = db::get_user_by_id_row(&conn, uid)
        .map_err(|e| e.to_string())?
        .unwrap();

    insert_audit_log(
        &conn,
        Some(uid),
        Some(&user.username),
        "pdf_open",
        None,
        Some(&path),
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

/// DELETE PDF — admin only
#[tauri::command]
pub fn delete_pdf_by_session(session_token: String, pdf_id: i64) -> Result<(), String> {
    let conn = db::open_connection().map_err(|e| e.to_string())?;
    let uid = validate_session(&conn, &session_token)
        .map_err(|e| e.to_string())?
        .ok_or("invalid session")?;

    let user = db::get_user_by_id_row(&conn, uid)
        .map_err(|e| e.to_string())?
        .ok_or("user not found")?;

    if user.role != "admin" {
        return Err("admin role required".into());
    }

    let path: String = conn
        .query_row(
            "SELECT file_path FROM pdf_library WHERE id = ?1",
            params![pdf_id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let _ = fs::remove_file(&path);

    conn.execute("DELETE FROM pdf_library WHERE id = ?1", params![pdf_id])
        .map_err(|e| e.to_string())?;

    insert_audit_log(
        &conn,
        Some(uid),
        Some(&user.username),
        "pdf_delete",
        None,
        Some(&path),
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
