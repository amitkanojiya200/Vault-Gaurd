use std::fs;
use std::path::PathBuf;

/// Resolve PRABAL root (prefer D:, fallback to C:)
pub fn prabal_documents_root() -> Result<PathBuf, String> {
    let preferred = PathBuf::from("D:\\PRABAL\\Programs\\Documents");
    let fallback = PathBuf::from("C:\\PRABAL\\Programs\\Documents");

    let root = if preferred.parent().unwrap().exists() {
        preferred
    } else {
        fallback
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

    crate::db::insert_audit_log(
        &conn,
        Some(uid),
        Some(&user.username),
        "document_upload",
        None,
        Some(&dest.to_string_lossy()),
    )
    .ok();

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
