// src-tauri/src/document_store.rs
use std::fs;
use std::path::PathBuf;

/// Resolve PRABAL root (prefer D:, fallback to C:)
pub fn prabal_documents_root() -> Result<PathBuf, String> {
    let d_root = PathBuf::from("D:\\PRABAL\\Programs\\Documents");
    let c_root = PathBuf::from("C:\\PRABAL\\Programs\\Documents");

    if d_root.exists() {
        return Ok(d_root);
    }

    if c_root.exists() {
        return Ok(c_root);
    }

    // Neither exists → prefer D if drive exists
    let root = if PathBuf::from("D:\\").exists() {
        d_root
    } else {
        c_root
    };

    fs::create_dir_all(&root).map_err(|e| e.to_string())?;
    Ok(root)
}

/// Resolve folder by key (auto-create)
pub fn resolve_folder(folder_key: &str) -> Result<PathBuf, String> {
    let mut root = prabal_documents_root()?;
    root.push(folder_key);

    fs::create_dir_all(&root).map_err(|e| e.to_string())?;
    Ok(root)
}

#[tauri::command]
pub fn upload_document_by_session(
    session_token: String,
    folder_key: String,
    source_path: String,
) -> Result<(), String> {
    let conn = crate::db::open_connection().map_err(|e| e.to_string())?;
    let uid = crate::session::validate_session(&conn, &session_token)?.ok_or("invalid session")?;
    crate::db::init_db_schema(&conn).map_err(|e| format!("init schema: {}", e))?;

    let user = crate::db::get_user_by_id_row(&conn, uid)?.ok_or("user not found")?;

    if user.role != "admin" {
        return Err("admin role required".into());
    }

    // ✅ FIX: bind PathBuf to variable
    let source_pb = PathBuf::from(&source_path);

    let filename = source_pb.file_name().ok_or("invalid filename")?.to_owned(); // own it safely

    let folder = crate::document_store::resolve_folder(&folder_key)?;
    let dest = folder.join(filename);

    fs::copy(&source_pb, &dest).map_err(|e| format!("copy failed: {}", e))?;

    // audit
    let detail = format!("'{}' Uploaded by '{}'", dest.to_string_lossy(), user.role);
    // let _ = crate::db::insert_audit_log(
    //     &conn,
    //     Some(uid),
    //     Some(&user.username),
    //     "document_upload",
    //     None,
    //     Some(&detail),
    // );
    crate::db::insert_audit_log(
        &conn,
        Some(uid),
        Some(&user.username),
        "document_upload",
        None,
        Some(&detail),
    )
    .map_err(|e| format!("audit insert failed: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn list_documents_by_session(
    session_token: String,
    folder_key: String,
) -> Result<Vec<String>, String> {
    let conn = crate::db::open_connection().map_err(|e| e.to_string())?;
    crate::session::validate_session(&conn, &session_token)?.ok_or("invalid session")?;

    let folder = crate::document_store::resolve_folder(&folder_key)?;

    let mut out = Vec::new();
    for entry in fs::read_dir(folder).map_err(|e| e.to_string())? {
        let e = entry.map_err(|e| e.to_string())?;
        if e.path().is_file() {
            out.push(e.path().to_string_lossy().to_string());
        }
    }

    Ok(out)
}

#[tauri::command]
pub fn delete_document_by_session(
    session_token: String,
    folder_key: String,
    absolute_path: String,
) -> Result<(), String> {
    let conn = crate::db::open_connection().map_err(|e| e.to_string())?;
    let uid = crate::session::validate_session(&conn, &session_token)?.ok_or("invalid session")?;

    let user = crate::db::get_user_by_id_row(&conn, uid)?.ok_or("user not found")?;

    if user.role != "admin" {
        return Err("admin role required".into());
    }

    // Resolve expected folder root
    let folder = crate::document_store::resolve_folder(&folder_key)?;

    let target = PathBuf::from(&absolute_path);

    // 🔐 SECURITY: ensure file is inside allowed folder
    let canonical_folder = folder
        .canonicalize()
        .map_err(|e| format!("folder canonicalize error: {}", e))?;

    let canonical_target = target
        .canonicalize()
        .map_err(|e| format!("invalid path: {}", e))?;

    if !canonical_target.starts_with(&canonical_folder) {
        return Err("unauthorized path".into());
    }

    if !canonical_target.is_file() {
        return Err("file does not exist".into());
    }

    std::fs::remove_file(&canonical_target).map_err(|e| format!("delete failed: {}", e))?;

    // audit
    let detail = format!(
        "'{}' Deleted by '{}'",
        canonical_target.to_string_lossy(),
        user.role
    );
    let _ = crate::db::insert_audit_log(
        &conn,
        Some(uid),
        Some(&user.username),
        "document_delete",
        None,
        Some(&detail),
    );

    Ok(())
}
