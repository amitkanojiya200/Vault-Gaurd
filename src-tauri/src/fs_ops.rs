// src-tauri/src/fs_ops.rs
use chrono::Utc;
use once_cell::sync::Lazy;
use rusqlite::params; // params! macro
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::OpenOptions;
use std::os::windows::prelude::OpenOptionsExt;
use std::process::Command;
use std::sync::Mutex;
use std::time::UNIX_EPOCH;
use std::{
    fs, io,
    path::{Path, PathBuf},
    time::SystemTime,
};
use sysinfo::{DiskExt, System, SystemExt};
use tauri::command;
use tauri::AppHandle;
use uuid::Uuid;

#[derive(Serialize)]
pub struct DriveInfo {
    pub id: String,
    pub label: String,
    pub mount_point: String,
    pub total_bytes: u64,
    pub available_bytes: u64,
    pub file_system: String,
    pub last_scan_epoch: Option<i64>,
}

#[derive(Serialize)]
pub struct FileEntry {
    pub name: String,
    pub is_dir: bool,
    pub size: Option<i64>,
    pub modified: Option<i64>, // epoch seconds
    pub path: String,
}
#[derive(Debug, Serialize)]
pub struct FsItem {
    pub name: String,
    pub is_dir: bool,
    pub size: Option<u64>,
    pub modified: Option<String>,
    pub path: String,
}

/// Try to format a SystemTime into a simple "YYYY-MM-DD HH:MM" string.
fn format_system_time(st: SystemTime) -> Option<String> {
    let datetime: chrono::DateTime<chrono::Local> = st.into();
    Some(datetime.format("%Y-%m-%d %H:%M").to_string())
}

/// Normalize drive string for storing in `files_index.drive`.
pub(crate) fn normalize_drive_for_storage(path: &str) -> String {
    #[cfg(target_os = "windows")]
    {
        // Ensure we handle Windows long-path: prefix is "\\?\"
        // In Rust string literal we represent it as "\\\\?\\"
        let mut p = path.to_string();

        // Trim leading long-path prefix "\\?\"
        if p.starts_with("\\\\?\\") {
            p = p.trim_start_matches("\\\\?\\").to_string();
        }

        // For UNC long-path form "\\?\UNC\server\share" -> we want "\\server\share"
        if p.to_lowercase().starts_with("unc\\") {
            // remove the "UNC\" prefix then ensure it begins with double backslash
            p = p.trim_start_matches("UNC\\").to_string();
            if !p.starts_with("\\\\") {
                p = format!("\\\\{}", p);
            }
        }

        // If we have an absolute path with drive letter like "C:\..." return "C:\"
        if p.len() >= 2 && p.as_bytes()[1] == b':' {
            // normalize to uppercase drive letter + colon + backslash
            let drive_letter = p.chars().next().unwrap().to_ascii_uppercase();
            return format!("{}:\\", drive_letter);
        }

        // Fallback: first path component (use mount / share as-is)
        if let Some(comp) = std::path::Path::new(&p).components().next() {
            return comp.as_os_str().to_string_lossy().to_string();
        }

        p
    }

    #[cfg(not(target_os = "windows"))]
    {
        if path.starts_with('/') {
            "/".to_string()
        } else {
            path.to_string()
        }
    }
}

fn is_excluded_path(path: &str) -> bool {
    // Normalize to lowercase for comparisons
    let lower = path.to_lowercase();

    // ---------------- Windows-specific exclusions ----------------
    if cfg!(target_os = "windows") {
        // Windows directory
        if lower.contains("\\windows\\") || lower.ends_with("\\windows") {
            return true;
        }

        // Program Files (both flavours)
        if lower.contains("\\program files\\") || lower.contains("\\program files (x86)\\") {
            return true;
        }

        // PerfLogs
        if lower.contains("\\perflogs\\") {
            return true;
        }

        // Recycle Bin
        if lower.contains("\\$recycle.bin\\") || lower.contains("\\recycle.bin\\") {
            return true;
        }

        // System Volume Information
        if lower.contains("\\system volume information") {
            return true;
        }

        // Hibernation / pagefile (files)
        if lower.ends_with("\\pagefile.sys") || lower.ends_with("\\hiberfil.sys") {
            return true;
        }

        // Windows Installer / WinSxS
        if lower.contains("\\windows\\winsxs") || lower.contains("\\windows\\installer") {
            return true;
        }

        // ProgramData
        if lower.contains("\\programdata\\") {
            return true;
        }
    }

    // ---------------- Cross-platform exclusions ----------------

    // Node / JS ecosystems
    if lower.contains("node_modules") {
        return true;
    }

    // Git metadata
    if lower.contains("/.git/")
        || lower.contains("\\.git\\")
        || lower.ends_with("/.git")
        || lower.ends_with("\\.git")
    {
        return true;
    }

    // Cache directories
    if lower.contains("\\.cache\\") || lower.contains("/.cache/") {
        return true;
    }

    // macOS system metadata
    if lower.contains(".spotlight-v100") || lower.contains(".fseventsd") {
        return true;
    }

    false
}

pub(crate) fn doc_type_for_path(path: &str, is_dir: bool) -> String {
    if is_dir {
        return "dir".to_string();
    }
    // get extension (lowercase)
    let ext = std::path::Path::new(path)
        .extension()
        .and_then(|s| s.to_str())
        .map(|s| s.to_lowercase())
        .unwrap_or_default();

    match ext.as_str() {
        "pdf" => "PDF".to_string(),
        "doc" | "docx" | "odt" => "DOC".to_string(),
        "xls" | "xlsx" | "csv" => "SHEET".to_string(),
        "ppt" | "pptx" => "PPT".to_string(),
        "jpg" | "jpeg" | "png" | "gif" | "bmp" | "webp" | "heic" => "IMAGE".to_string(),
        "zip" | "rar" | "7z" | "tar" | "gz" => "ARCHIVE".to_string(),
        "log" | "txt" | "md" | "json" | "xml" | "yml" | "yaml" => "TEXT".to_string(),
        "exe" | "dll" | "sys" => "BINARY".to_string(),
        "" => "unknown".to_string(),
        _ => ext.to_uppercase(), // fallback: use extension itself as type
    }
}

/// Start indexing ALL mounted drives + home directory in a background thread and return a job UUID.
/// Only admins may start indexing.
#[tauri::command]
pub fn index_all_drives_start(
    app: tauri::AppHandle,
    session_token: String,
) -> Result<String, String> {
    // validate session + admin (outer conn only for auth + audit)
    let conn = crate::db::open_connection().map_err(|e| format!("db open: {}", e))?;
    let maybe_uid = crate::session::validate_session(&conn, &session_token)
        .map_err(|e| format!("session validation: {}", e))?;
    let uid = maybe_uid.ok_or_else(|| "invalid session".to_string())?;
    let user = crate::db::get_user_by_id_row(&conn, uid)
        .map_err(|e| format!("db user lookup: {}", e))?
        .ok_or_else(|| "user not found".to_string())?;
    if user.role != "admin" {
        return Err("admin role required".into());
    }

    // Build a list of starting roots (mount points)
    let mut sys = System::new_all();
    sys.refresh_disks_list();
    sys.refresh_disks();
    let mut roots: Vec<PathBuf> = Vec::new();

    for disk in sys.disks() {
        let mount = disk.mount_point().to_path_buf();
        // try to canonicalize best-effort, fallback to mount path as-is
        let root_path = std::fs::canonicalize(&mount).unwrap_or(mount.clone());
        // avoid duplicates
        if !roots.iter().any(|r| r == &root_path) {
            roots.push(root_path);
        }
    }

    // also include user home dir (if not already present)
    if let Some(home) = dirs::home_dir() {
        if !roots.iter().any(|r| r == &home) {
            roots.push(home);
        }
    }

    if roots.is_empty() {
        return Err("no drives or home directory found to index".into());
    }

    // create job id and set initial state
    let job_id = Uuid::new_v4().to_string();
    {
        let mut m = INDEX_JOBS
            .lock()
            .map_err(|_| "job mutex poisoned".to_string())?;
        m.insert(
            job_id.clone(),
            IndexJobState::Running {
                processed: 0,
                last_path: None,
            },
        );
    }

    // clone values for thread
    let job_clone = job_id.clone();
    let roots_for_indexer = roots.clone();
    let roots_for_watcher = roots.clone();

    fn fail_job(job_id: &str, message: String) {
        if let Ok(mut m) = INDEX_JOBS.lock() {
            m.insert(job_id.to_string(), IndexJobState::Failed { message });
        }
    }

    // Spawn background thread (uses its own DB connection)
    // Spawn background thread (uses its own DB connection)
    std::thread::spawn(move || {
        let conn2 = match crate::db::open_connection() {
            Ok(c) => c,
            Err(e) => {
                fail_job(&job_clone, format!("worker db open failed: {}", e));
                return;
            }
        };

        if let Err(e) = ensure_files_index_tables(&conn2) {
            fail_job(&job_clone, format!("ensure tables failed: {}", e));
            return;
        }

        let mut processed: usize = 0;
        let now = Utc::now().timestamp();
        let mut stack: Vec<PathBuf> = roots_for_indexer;

        while let Some(p) = stack.pop() {
            // update last_path
            {
                if let Ok(mut m) = INDEX_JOBS.lock() {
                    m.insert(
                        job_clone.clone(),
                        IndexJobState::Running {
                            processed,
                            last_path: Some(p.to_string_lossy().to_string()),
                        },
                    );
                }
            }

            let read_dir = match std::fs::read_dir(&p) {
                Ok(r) => r,
                Err(e) => {
                    // Non-fatal but logged
                    eprintln!("[index] read_dir failed at {}: {}", p.display(), e);
                    continue;
                }
            };

            for entry_res in read_dir {
                let entry = match entry_res {
                    Ok(e) => e,
                    Err(e) => {
                        eprintln!("[index] dir entry read error in {}: {}", p.display(), e);
                        continue;
                    }
                };

                let path_buf = entry.path();

                let meta = match entry.metadata() {
                    Ok(m) => m,
                    Err(e) => {
                        eprintln!("[index] metadata failed for {}: {}", path_buf.display(), e);
                        continue;
                    }
                };

                let is_dir = meta.is_dir();
                let size_opt = if is_dir {
                    None
                } else {
                    Some(meta.len() as i64)
                };

                // ⚠️ Canonicalize with error visibility
                let canonical_buf = match std::fs::canonicalize(&path_buf) {
                    Ok(c) => c,
                    Err(e) => {
                        eprintln!(
                            "[index] canonicalize failed for {}: {}",
                            path_buf.display(),
                            e
                        );
                        path_buf.clone()
                    }
                };

                let path_str = canonical_buf.to_string_lossy().to_string();
                let name = entry.file_name().to_string_lossy().to_string();
                let file_type = if is_dir { "dir" } else { "file" }.to_string();
                let doc_type = doc_type_for_path(&path_str, is_dir);
                let drive_val = normalize_drive_for_storage(&path_str);

                if let Err(e) = conn2.execute(
                "INSERT INTO files_index (path, name, file_type, doc_type, size, indexed_at, drive)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
                 ON CONFLICT(path)
                 DO UPDATE SET
                   name=excluded.name,
                   file_type=excluded.file_type,
                   doc_type=excluded.doc_type,
                   size=excluded.size,
                   indexed_at=excluded.indexed_at,
                   drive=excluded.drive",
                params![path_str, name, file_type, doc_type, size_opt, now, drive_val],
            ) {
                // ⚠️ DB error = fatal (surface it)
                fail_job(
                    &job_clone,
                    format!("db insert failed at {}: {}", canonical_buf.display(), e),
                );
                return;
            }

                processed += 1;

                if is_dir && !is_excluded_path(&path_str) {
                    stack.push(canonical_buf);
                }
            }
        }

        // mark finished
        if let Ok(mut m) = INDEX_JOBS.lock() {
            m.insert(job_clone.clone(), IndexJobState::Finished { processed });
        }

        // START FS WATCHER AFTER INDEXING
        let db_path = match crate::db::get_db_path() {
            Ok(p) => p,
            Err(e) => {
                eprintln!("[watcher] db path error: {}", e);
                return;
            }
        };

        let app_for_watcher = app.clone();
        let roots_for_watcher = roots_for_watcher.clone();

        std::thread::spawn(move || {
            if let Err(e) =
                crate::fs_watch::start_fs_watcher(roots_for_watcher, db_path, app_for_watcher)
            {
                eprintln!("[fs_watch] error: {}", e);
            }
        });
    });

    // audit (outer conn)
    let _ = crate::db::insert_audit_log(
        &conn,
        Some(uid),
        Some(&user.username),
        "index_all_drives_start",
        None,
        Some(&format!("started indexing {} roots", roots.len())),
    );

    Ok(job_id)
}

/// Remove indexed files that no longer exist on disk
pub fn reconcile_missing_files(conn: &rusqlite::Connection) -> Result<u64, String> {
    let mut stmt = conn
        .prepare("SELECT path FROM files_index")
        .map_err(|e| e.to_string())?;

    let paths = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;

    let mut removed = 0;

    for p in paths {
        let path = p.map_err(|e| e.to_string())?;
        if !std::path::Path::new(&path).exists() {
            conn.execute(
                "DELETE FROM files_index WHERE path = ?1",
                rusqlite::params![path],
            )
            .map_err(|e| e.to_string())?;
            removed += 1;
        }
    }

    Ok(removed)
}

/// Very simple Windows-style drive detection: C:\ .. Z:\ if path exists.
// fn detect_drives() -> Vec<DriveInfo> {
//     let mut drives = Vec::new();

//     #[cfg(target_family = "windows")]
//     {
//         for letter in b'C'..=b'Z' {
//             let drive_str = format!("{}:\\", letter as char);
//             let path = Path::new(&drive_str);
//             if path.exists() {
//                 drives.push(DriveInfo {
//                     id: drive_str.clone(),
//                     label: format!("{} · Local", drive_str.trim_end_matches('\\')),

//                 });
//             }
//         }
//     }

//     #[cfg(not(target_family = "windows"))]
//     {
//         // For Linux/macOS: treat root as a "drive".
//         drives.push(DriveInfo {
//             id: "/".to_string(),
//             label: "Root /".to_string(),
//         });
//     }

//     drives
// }

/// Build FsItem from a directory entry.
fn entry_to_fs_item(base: &Path, entry: fs::DirEntry) -> io::Result<FsItem> {
    let metadata = entry.metadata()?;
    let is_dir = metadata.is_dir();
    let size = if is_dir { None } else { Some(metadata.len()) };

    let modified = metadata.modified().ok().and_then(|t| format_system_time(t));

    let file_name = entry.file_name().to_string_lossy().to_string();

    let full_path: PathBuf = base.join(&file_name);
    let full_path_str = full_path.to_string_lossy().to_string();

    Ok(FsItem {
        name: file_name,
        is_dir,
        size,
        modified,
        path: full_path_str,
    })
}

/// List logical drives (C:\, D:\ etc).
// #[tauri::command]
// pub fn list_drives() -> Result<Vec<DriveInfo>, String> {
//     Ok(detect_drives())
// }

/// recent_items: simple first-level scan across roots
#[tauri::command]
pub fn recent_items(roots: Vec<String>, limit: usize) -> Result<Vec<FsItem>, String> {
    let mut acc: Vec<FsItem> = Vec::new();

    for root in roots {
        let base = Path::new(&root);
        if !base.exists() || !base.is_dir() {
            continue;
        }

        let read_dir = match fs::read_dir(base) {
            Ok(rd) => rd,
            Err(err) => {
                eprintln!("Failed to read root {}: {}", root, err);
                continue;
            }
        };

        for entry_res in read_dir {
            if acc.len() >= limit * 3 {
                break;
            }
            if let Ok(entry) = entry_res {
                if let Ok(item) = entry_to_fs_item(base, entry) {
                    acc.push(item);
                }
            }
        }
    }

    // sort by modified desc
    acc.sort_by(|a, b| match (&a.modified, &b.modified) {
        (Some(ma), Some(mb)) => mb.cmp(ma),
        (Some(_), None) => std::cmp::Ordering::Less,
        (None, Some(_)) => std::cmp::Ordering::Greater,
        (None, None) => std::cmp::Ordering::Equal,
    });

    acc.truncate(limit);
    Ok(acc)
}

/// Open a local path validated by session token (server-side).
/// Frontend call: invoke('open_path_by_session', { session_token, path })
#[tauri::command]
pub fn open_path_by_session(
    _app: AppHandle,
    session_token: String,
    path: String,
) -> Result<(), String> {
    let conn = crate::db::open_connection()?;
    crate::db::init_db_schema(&conn)?;

    // Validate session
    let maybe_uid = crate::session::validate_session(&conn, &session_token)?;
    let uid = maybe_uid.ok_or_else(|| "Invalid or expired session".to_string())?;

    // Get username for audit safely
    let user_row =
        crate::db::get_user_by_id_row(&conn, uid)?.ok_or_else(|| "User not found".to_string())?;
    let actor_username = Some(user_row.username.clone());

    // Canonicalize path and allowlist: disallow attempts to open system root or home unless allowed
    let canonical = std::fs::canonicalize(&path).map_err(|e| format!("Bad path: {}", e))?;
    // Example allowlist: only allow opening if path is under user's home directory or /mnt
    let home = dirs::home_dir().ok_or("Cannot resolve home dir")?;
    if !canonical.starts_with(&home) {
        // optionally allow other roots, or reject
        return Err("Open path denied: path is not under allowed locations".into());
    }

    // Audit
    let _ = crate::db::insert_audit_log(
        &conn,
        Some(uid),
        actor_username.as_deref(),
        "open_path",
        None,
        Some(&path),
    );

    // Platform open: spawn and don't block
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&canonical)
            .spawn()
            .ok();
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&canonical)
            .spawn()
            .ok();
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    {
        std::process::Command::new("xdg-open")
            .arg(&canonical)
            .spawn()
            .ok();
    }

    Ok(())
}

// Add this struct to return storage info (serializable)
#[derive(Serialize)]
pub struct StorageDriveInfo {
    pub drive: String,
    pub total_bytes: u64,
    pub available_bytes: u64,
    pub used_bytes: u64,
    pub total_gb: f64,
    pub used_gb: f64,
    pub available_gb: f64,
    pub last_scan_epoch: i64,
}

// Helper: convert bytes -> GB (float)
fn bytes_to_gb(b: u64) -> f64 {
    (b as f64) / 1024.0 / 1024.0 / 1024.0
}

/// Tauri command: return files per drive using DB helper
#[command]
pub fn get_files_per_drive(
    _app: AppHandle,
    limit: Option<i64>,
) -> Result<Vec<(String, i64)>, String> {
    let conn = crate::db::open_connection()?;
    crate::db::init_db_schema(&conn)?;
    // crate::db::get_files_per_drive returns Result<Vec<(String,i64)>, rusqlite::Error>
    crate::db::get_files_per_drive(&conn, limit).map_err(|e| e.to_string())
}

/// Tauri command: return indexing counts by drive and type
#[command]
pub fn get_indexing_by_drive_and_type(
    _app: AppHandle,
    limit: Option<i64>,
) -> Result<Vec<(String, String, i64)>, String> {
    let conn = crate::db::open_connection()?;
    crate::db::init_db_schema(&conn)?;
    crate::db::get_indexing_by_drive_and_type(&conn, limit).map_err(|e| e.to_string())
}

// in src-tauri/src/fs_ops.rs (near other #[tauri::command] wrappers)
#[tauri::command]
pub fn get_indexing_summary_global() -> Result<Vec<(String, i64)>, String> {
    let conn = crate::db::open_connection().map_err(|e| format!("db open: {}", e))?;
    crate::db::get_indexing_by_category_global(&conn).map_err(|e| e.to_string())
}

/// Tauri command: get local storage / drive info using sysinfo
/// This is intentionally lightweight: it does not write DB — simply reads OS metadata.
#[command]
pub fn get_storage_info_with_scan(_app: AppHandle) -> Result<Vec<StorageDriveInfo>, String> {
    // Create and refresh system info
    let mut sys = System::new_all();
    sys.refresh_all();

    let epoch_now = chrono::Utc::now().timestamp();

    let mut out: Vec<StorageDriveInfo> = Vec::new();

    for disk in sys.disks() {
        // disk.name() gives OsStr; try to stringify
        let name = disk.name().to_string_lossy().to_string();
        let total = disk.total_space(); // u64
        let avail = disk.available_space(); // u64
        let used = total.saturating_sub(avail);

        out.push(StorageDriveInfo {
            drive: name,
            total_bytes: total,
            available_bytes: avail,
            used_bytes: used,
            total_gb: bytes_to_gb(total),
            used_gb: bytes_to_gb(used),
            available_gb: bytes_to_gb(avail),
            last_scan_epoch: epoch_now,
        });
    }

    // If no disks were found, still return empty Vec (frontend will show "No drive info")
    Ok(out)
}

// -------------- FILE EXPLORER -------------------------
/// Open a file with the system default application after validating session.
/// This function canonicalizes the path, verifies it's a file, inserts an audit log,
/// and spawns the system opener (non-blocking).
#[tauri::command]
pub fn open_file_by_session(session_token: String, path: String) -> Result<(), String> {
    // Open DB connection
    let conn = crate::db::open_connection().map_err(|e| format!("db open error: {}", e))?;

    // Validate session: returns Option<uid>
    let maybe_uid = crate::session::validate_session(&conn, &session_token)
        .map_err(|e| format!("session validation error: {}", e))?;
    let uid = maybe_uid.ok_or_else(|| "invalid or expired session".to_string())?;

    // Canonicalize path
    let canonical = std::fs::canonicalize(&path)
        .map_err(|e| format!("cannot canonicalize path '{}' : {}", path, e))?;

    // OPTIONAL: allowlist - adjust to your policy.
    // Example: allow files under the user's home dir only (safe default).
    // if let Some(home) = dirs::home_dir() {
    //     if !canonical.starts_with(&home) {
    //         return Err("open_file_by_session: path is outside allowed locations".into());
    //     }
    // }

    // Ensure it's a file
    let md = std::fs::metadata(&canonical).map_err(|e| format!("stat error: {}", e))?;
    if !md.is_file() {
        return Err("path is not a file".into());
    }

    // Resolve actor username for audit (non-fatal)
    let actor_username_opt = match crate::db::get_user_by_id_row(&conn, uid) {
        Ok(Some(urow)) => Some(urow.username),
        _ => None,
    };

    // Insert audit log using your db.rs signature:
    // insert_audit_log(conn, actor_user_id, actor_username, action, target_user_id, details)
    let _ = crate::db::insert_audit_log(
        &conn,
        Some(uid),
        actor_username_opt.as_deref(),
        "open_file",
        None, // target_user_id (not relevant here)
        Some(&canonical.to_string_lossy()),
    );

    // Spawn platform-specific opener in a background thread (non-blocking)
    let canonical_for_thread = canonical.to_string_lossy().to_string();
    std::thread::spawn(move || {
        #[cfg(target_os = "windows")]
        {
            let _ = Command::new("explorer").arg(&canonical_for_thread).spawn();
        }
        #[cfg(target_os = "macos")]
        {
            let _ = Command::new("open").arg(&canonical_for_thread).spawn();
        }
        #[cfg(all(unix, not(target_os = "macos")))]
        {
            let _ = Command::new("xdg-open").arg(&canonical_for_thread).spawn();
        }
    });

    Ok(())
}

/// Read directory entries for `path`. Returns normalized list of FileEntry.
/// Requires valid session_token (but in debug builds we allow missing/invalid token for dev).
/// Read directory entries for `path`. Returns normalized list of FileEntry.
/// session_token is optional (Option<String>) — in release builds a token is required;
/// in debug builds missing/invalid token is tolerated for local dev convenience.
#[tauri::command]
pub fn read_dir(session_token: Option<String>, path: String) -> Result<Vec<FileEntry>, String> {
    // open DB connection first (needed for session validation)
    let conn = crate::db::open_connection().map_err(|e| format!("db open error: {}", e))?;

    // allow missing/invalid session in debug builds for local dev convenience
    let allow_without_session = cfg!(debug_assertions);

    // validate session (treat errors as None in debug if allowed)
    let uid_opt = if let Some(ref token) = session_token {
        match crate::session::validate_session(&conn, token) {
            Ok(m) => m,
            Err(e) => {
                if allow_without_session {
                    None
                } else {
                    return Err(format!("session validation error: {}", e));
                }
            }
        }
    } else {
        if allow_without_session {
            None
        } else {
            return Err("read_dir: session_token required".to_string());
        }
    };

    if uid_opt.is_none() && !allow_without_session {
        return Err("invalid or expired session".to_string());
    }

    // canonicalize requested path
    let canonical = std::fs::canonicalize(&path)
        .map_err(|e| format!("cannot canonicalize path '{}' : {}", path, e))?;
    let canonical_str = canonical.to_string_lossy().to_string();

    // --- Normalize path for matching (handle Windows long-path and UNC variants) ---
    let mut normalized = canonical_str.clone();
    #[cfg(target_os = "windows")]
    {
        // strip long-path prefix "\\?\" if present
        if normalized.to_lowercase().starts_with("\\\\?\\") {
            normalized = normalized.trim_start_matches("\\\\?\\").to_string();
        }
        // handle "\\?\UNC\server\share" -> "\\server\share"
        if normalized.to_lowercase().starts_with("unc\\") {
            // remove leading slashes then ensure it begins with double backslash
            normalized = normalized
                .trim_start_matches(|c| c == '\\' || c == '/')
                .to_string();
            normalized = format!("\\\\{}", normalized);
        }
    }
    let normalized_lower = normalized.to_lowercase();

    // --- Build allowlist from system disks and home dir (all lowercased) ---
    let mut sys = System::new_all();
    sys.refresh_disks_list();
    sys.refresh_disks();
    let mut allowed_mounts: Vec<String> = Vec::new();
    for disk in sys.disks() {
        let mount = disk.mount_point().to_string_lossy().to_string();
        if !mount.is_empty() {
            let mount_norm = mount
                .trim_end_matches(|c| c == '/' || c == '\\')
                .to_string()
                .to_lowercase();
            if !allowed_mounts.contains(&mount_norm) {
                allowed_mounts.push(mount_norm);
            }
        }
    }

    if let Some(home) = dirs::home_dir() {
        let home_norm = home
            .to_string_lossy()
            .to_string()
            .trim_end_matches(|c| c == '/' || c == '\\')
            .to_string()
            .to_lowercase();
        if !allowed_mounts.contains(&home_norm) {
            allowed_mounts.push(home_norm);
        }
    }

    // --- Windows-specific allowance for drive-letter roots and UNC ---
    let mut allowed = false;
    #[cfg(target_os = "windows")]
    {
        // Accept drive-letter roots like "C:\" (detect first non-slash then colon)
        let chars: Vec<char> = normalized.chars().collect();
        if let Some(idx) = chars.iter().position(|c| *c != '\\' && *c != '/') {
            if idx + 1 < chars.len() && chars[idx + 1] == ':' {
                allowed = true;
            }
        }
        // Accept UNC paths beginning with "\\" as allowed (server/share)
        if !allowed && normalized.starts_with("\\\\") {
            allowed = true;
        }
    }

    // If not allowed yet, match normalized path prefixes against discovered mounts
    if !allowed {
        allowed = allowed_mounts.iter().any(|m| {
            let m_with_sep = format!("{}{}", m, std::path::MAIN_SEPARATOR);
            normalized_lower.starts_with(m) || normalized_lower.starts_with(&m_with_sep)
        });
    }

    if !allowed {
        #[cfg(debug_assertions)]
        {
            println!(
                "[fs_ops::read_dir] rejected path='{}' normalized='{}' allowed_mounts={:?}",
                canonical_str, normalized, allowed_mounts
            );
        }
        return Err("read_dir: path is outside allowed locations".into());
    }

    // --- Read directory entries and produce FileEntry list ---
    let mut entries: Vec<FileEntry> = Vec::new();
    let read = std::fs::read_dir(&canonical).map_err(|e| format!("read_dir error: {}", e))?;
    for entry in read {
        let e = entry.map_err(|e| format!("read_dir entry error: {}", e))?;
        let md = e.metadata().map_err(|e| format!("metadata error: {}", e))?;
        let is_dir = md.is_dir();
        let size_opt = if is_dir { None } else { Some(md.len() as i64) };
        let modified_opt = md.modified().ok().and_then(|t| {
            t.duration_since(std::time::UNIX_EPOCH)
                .ok()
                .map(|d| d.as_secs() as i64)
        });
        let name = e.file_name().to_string_lossy().to_string();
        let path_full = e.path().to_string_lossy().to_string();

        entries.push(FileEntry {
            name,
            is_dir,
            size: size_opt,
            modified: modified_opt,
            path: path_full,
        });
    }

    // Sort: directories first, then by name (case-insensitive)
    entries.sort_by(|a, b| {
        if a.is_dir && !b.is_dir {
            std::cmp::Ordering::Less
        } else if !a.is_dir && b.is_dir {
            std::cmp::Ordering::Greater
        } else {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        }
    });

    Ok(entries)
}

#[tauri::command]
pub fn index_path(session_token: String, root_path: String) -> Result<usize, String> {
    // validate session + admin
    let conn = crate::db::open_connection().map_err(|e| format!("db open: {}", e))?;
    let maybe_uid = crate::session::validate_session(&conn, &session_token)
        .map_err(|e| format!("session validation: {}", e))?;
    let uid = maybe_uid.ok_or_else(|| "invalid session".to_string())?;

    let user = crate::db::get_user_by_id_row(&conn, uid)
        .map_err(|e| format!("db user lookup: {}", e))?
        .ok_or_else(|| "user not found".to_string())?;
    if user.role != "admin" {
        return Err("admin role required".into());
    }

    // canonicalize & simple allowlist (reuse the same logic as in read_dir)
    let root = std::fs::canonicalize(&root_path)
        .map_err(|e| format!("cannot canonicalize root: {}", e))?;

    // Prepare DB: create tables if needed (idempotent)
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS files_index (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        file_type TEXT,
        doc_type TEXT,
        size INTEGER,
        indexed_at INTEGER NOT NULL,
        drive TEXT
    );",
    )
    .map_err(|e| e.to_string())?;

    let now = Utc::now().timestamp();

    // Walk synchronously and insert into files_index
    let mut inserted: usize = 0;
    let mut stack = vec![root];

    while let Some(p) = stack.pop() {
        let read = match std::fs::read_dir(&p) {
            Ok(r) => r,
            Err(_) => continue,
        };

        for entry in read.flatten() {
            let path_buf = entry.path();
            let meta = match entry.metadata() {
                Ok(m) => m,
                Err(_) => continue,
            };
            let is_dir = meta.is_dir();
            let size_opt = if is_dir {
                None
            } else {
                Some(meta.len() as i64)
            };

            // canonicalize best-effort (fallback to original)
            let canonical_buf = std::fs::canonicalize(&path_buf).unwrap_or(path_buf.clone());
            let path_str = canonical_buf.to_string_lossy().to_string();

            // name from entry
            let name = entry.file_name().to_string_lossy().to_string();

            // compute types using canonical path string
            let file_type = if is_dir { "dir" } else { "file" }.to_string();
            let doc_type = doc_type_for_path(&path_str, is_dir);
            let drive_val = normalize_drive_for_storage(&path_str);

            // Use the synchronous connection `conn` here
            let _ = conn.execute(
                "INSERT INTO files_index (path, name, file_type, doc_type, size, indexed_at, drive)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT(path)
         DO UPDATE SET
           name=excluded.name,
           file_type=excluded.file_type,
           doc_type=excluded.doc_type,
           size=excluded.size,
           indexed_at=excluded.indexed_at,
           drive=excluded.drive",
                params![path_str, name, file_type, doc_type, size_opt, now, drive_val],
            );

            inserted += 1;
            if is_dir && !is_excluded_path(&path_str) {
                // push canonical buf so later visits are normalized
                stack.push(canonical_buf);
            }
        }
    }

    // audit (use outer conn local here)
    let _ = crate::db::insert_audit_log(
        &conn,
        Some(uid),
        Some(&user.username),
        "index_path",
        None,
        Some(&root_path),
    );

    Ok(inserted)
}

// Simple in-memory job tracker for indexing jobs (job_id -> status)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IndexJobState {
    Running {
        processed: usize,
        last_path: Option<String>,
    },
    Finished {
        processed: usize,
    },
    Failed {
        message: String,
    },
}

// in-memory job tracker (same as before)
static INDEX_JOBS: Lazy<Mutex<HashMap<String, IndexJobState>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

fn ensure_files_index_tables(conn: &rusqlite::Connection) -> Result<(), String> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS files_index (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            file_type TEXT,
            doc_type TEXT,
            size INTEGER,
            indexed_at INTEGER NOT NULL,
            drive TEXT
        );
        CREATE VIRTUAL TABLE IF NOT EXISTS files_index_fts USING fts5(name, path, content='files_index', content_rowid='id');
        CREATE TRIGGER IF NOT EXISTS files_index_ai AFTER INSERT ON files_index BEGIN
          INSERT INTO files_index_fts(rowid, name, path) VALUES (new.id, new.name, new.path);
        END;
        CREATE TRIGGER IF NOT EXISTS files_index_ad AFTER DELETE ON files_index BEGIN
          INSERT INTO files_index_fts(files_index_fts, rowid, name, path) VALUES('delete', old.id, old.name, old.path);
        END;
        CREATE TRIGGER IF NOT EXISTS files_index_au AFTER UPDATE ON files_index BEGIN
          INSERT INTO files_index_fts(files_index_fts, rowid, name, path) VALUES('delete', old.id, old.name, old.path);
          INSERT INTO files_index_fts(rowid, name, path) VALUES (new.id, new.name, new.path);
        END;"
    ).map_err(|e| format!("ensure tables error: {}", e))?;
    Ok(())
}

/// Start indexing `root_path` in a background thread and return a job UUID.
/// Only admins may start indexing.
#[tauri::command]
pub fn index_path_start(session_token: String, root_path: String) -> Result<String, String> {
    // validate session + admin
    let conn = crate::db::open_connection().map_err(|e| format!("db open: {}", e))?;
    let maybe_uid = crate::session::validate_session(&conn, &session_token)
        .map_err(|e| format!("session validation: {}", e))?;
    let uid = maybe_uid.ok_or_else(|| "invalid session".to_string())?;
    let user = crate::db::get_user_by_id_row(&conn, uid)
        .map_err(|e| format!("db user lookup: {}", e))?
        .ok_or_else(|| "user not found".to_string())?;
    if user.role != "admin" {
        return Err("admin role required".into());
    }

    // canonicalize root and basic allowlist check
    let root = std::fs::canonicalize(&root_path)
        .map_err(|e| format!("cannot canonicalize root: {}", e))?;

    // create job id and set initial state
    let job_id = Uuid::new_v4().to_string();
    {
        let mut m = INDEX_JOBS
            .lock()
            .map_err(|_| "job mutex poisoned".to_string())?;
        m.insert(
            job_id.clone(),
            IndexJobState::Running {
                processed: 0,
                last_path: None,
            },
        );
    }

    // clone needed values to move into thread
    let root_clone = root.clone();
    let job_clone = job_id.clone();

    // Spawn background thread (uses its own DB connection)
    std::thread::spawn(move || {
        match crate::db::open_connection() {
            Ok(conn2) => {
                if let Err(e) = ensure_files_index_tables(&conn2) {
                    let mut m = INDEX_JOBS.lock().unwrap();
                    m.insert(job_clone.clone(), IndexJobState::Failed { message: e });
                    return;
                }

                let mut processed: usize = 0usize;
                let now = Utc::now().timestamp();
                let mut stack = vec![root_clone];

                while let Some(p) = stack.pop() {
                    // update last_path
                    {
                        let mut m = INDEX_JOBS.lock().unwrap();
                        m.insert(
                            job_clone.clone(),
                            IndexJobState::Running {
                                processed,
                                last_path: Some(p.to_string_lossy().to_string()),
                            },
                        );
                    }

                    let read = match std::fs::read_dir(&p) {
                        Ok(r) => r,
                        Err(_) => continue,
                    };

                    for entry in read.flatten() {
                        let path_buf = entry.path();
                        let meta = match entry.metadata() {
                            Ok(m) => m,
                            Err(_) => continue,
                        };
                        let is_dir = meta.is_dir();
                        let size_opt = if is_dir {
                            None
                        } else {
                            Some(meta.len() as i64)
                        };
                        let path_str = path_buf.to_string_lossy().to_string();
                        let name = entry.file_name().to_string_lossy().to_string();
                        let file_type = if is_dir { "dir" } else { "file" }.to_string();

                        // Normalize drive via top-level helper; conn2 used here (not outer conn)
                        let drive_val = normalize_drive_for_storage(&path_str);
                        let doc_type = doc_type_for_path(&path_str, is_dir); // NEW

                        let _ = conn2.execute(
    "INSERT INTO files_index (path, name, file_type, doc_type, size, indexed_at, drive)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
     ON CONFLICT(path)
     DO UPDATE SET
       name=excluded.name,
       file_type=excluded.file_type,
       doc_type=excluded.doc_type,
       size=excluded.size,
       indexed_at=excluded.indexed_at,
       drive=excluded.drive",
    params![path_str, name, file_type, doc_type, size_opt, now, drive_val],
);

                        processed += 1;
                        if is_dir && !is_excluded_path(&path_str) {
                            stack.push(path_buf);
                        }
                    }
                }

                // mark finished
                let mut m = INDEX_JOBS.lock().unwrap();
                m.insert(job_clone.clone(), IndexJobState::Finished { processed });
            }
            Err(e) => {
                let mut m = INDEX_JOBS.lock().unwrap();
                m.insert(
                    job_clone.clone(),
                    IndexJobState::Failed {
                        message: format!("db open error in worker: {}", e),
                    },
                );
            }
        }
    });

    // audit using outer conn
    let _ = crate::db::insert_audit_log(
        &conn,
        Some(uid),
        Some(&user.username),
        "index_start",
        None,
        Some(&root_path),
    );

    Ok(job_id)
}

/// Poll index status by job id
#[tauri::command]
pub fn get_index_status(job_id: String) -> Result<Option<IndexJobState>, String> {
    let m = INDEX_JOBS
        .lock()
        .map_err(|_| "job mutex poisoned".to_string())?;
    Ok(m.get(&job_id).cloned())
}

/// Search across indexed files using FTS5 (fast). Returns FileEntry-like list.
/// Search across indexed files using FTS5 (fast). Returns FileEntry-like list.
/// q is the query (supports simple FTS5 syntax). limit/offset optional.
///
/// NOTE: session_token is now optional. If provided, we validate session; if not, we allow unauthenticated global search.
#[tauri::command]
pub fn search_files(
    session_token: Option<String>,
    q: String,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<FileEntry>, String> {
    // If token supplied, validate session. If not, allow unauthenticated search.
    if let Some(ref token) = session_token {
        let conn_check =
            crate::db::open_connection().map_err(|e| format!("db open (session check): {}", e))?;
        let maybe_uid = crate::session::validate_session(&conn_check, token)
            .map_err(|e| format!("session validation: {}", e))?;
        let _ = maybe_uid.ok_or_else(|| "invalid session".to_string())?;
        // drop conn_check (goes out of scope)
    }

    let conn = crate::db::open_connection().map_err(|e| format!("db open: {}", e))?;
    let q_trim = q.trim();
    if q_trim.is_empty() {
        return Ok(Vec::new());
    }

    let lim = limit.unwrap_or(200);
    let off = offset.unwrap_or(0);

    ensure_files_index_tables(&conn).map_err(|e| format!("ensure tables: {}", e))?;

    // naive safe-ish transform for prefix match
    let fts_query = format!("\"{}\"*", q_trim.replace('"', "\"\""));

    let sql = "SELECT fi.path, fi.name, fi.file_type, fi.size, fi.indexed_at
FROM files_index fi
JOIN files_index_fts ON files_index_fts.rowid = fi.id
WHERE files_index_fts MATCH ?1
ORDER BY fi.indexed_at DESC
LIMIT ?2 OFFSET ?3
";

    let mut stmt = conn
        .prepare(sql)
        .map_err(|e| format!("prepare error: {}", e))?;

    let rows = stmt
        .query_map(params![fts_query, lim, off], |row| {
            let path: String = row.get(0)?;
            let name: String = row.get(1)?;
            let file_type: Option<String> = row.get(2)?;
            let size: Option<i64> = row.get(3)?;
            let indexed_at: Option<i64> = row.get(4)?;
            Ok(FileEntry {
                name,
                is_dir: file_type.as_deref() == Some("dir"),
                size,
                modified: indexed_at,
                path,
            })
        })
        .map_err(|e| format!("query_map error: {}", e))?;

    let mut out = Vec::new();
    for r in rows {
        if let Ok(e) = r {
            out.push(e);
        }
    }
    Ok(out)
}

// -----------------------------
// Additional file/folder CRUD commands
// -----------------------------
/// Helper: enforce basic allowlist like other commands (returns canonical PathBuf)
fn canonical_and_allow(path: &str) -> Result<std::path::PathBuf, String> {
    let canonical = std::fs::canonicalize(path)
        .map_err(|e| format!("cannot canonicalize path '{}' : {}", path, e))?;
    // Basic allowlist: allow if under home or any discovered disk mount (same logic as read_dir)
    let mut sys = System::new_all();
    sys.refresh_disks_list();
    sys.refresh_disks();

    let canonical_str = canonical.to_string_lossy().to_string();
    let mut normalized = canonical_str.clone();
    #[cfg(target_os = "windows")]
    {
        if normalized.to_lowercase().starts_with("\\\\?\\") {
            normalized = normalized.trim_start_matches("\\\\?\\").to_string();
        }
        if normalized.to_lowercase().starts_with("unc\\") {
            normalized = normalized
                .trim_start_matches(|c| c == '\\' || c == '/')
                .to_string();
            normalized = format!("\\\\{}", normalized);
        }
    }
    let normalized_lower = normalized.to_lowercase();

    let mut allowed_mounts: Vec<String> = Vec::new();
    for disk in sys.disks() {
        let mount = disk.mount_point().to_string_lossy().to_string();
        if !mount.is_empty() {
            let mount_norm = mount
                .trim_end_matches(|c| c == '/' || c == '\\')
                .to_string()
                .to_lowercase();
            if !allowed_mounts.contains(&mount_norm) {
                allowed_mounts.push(mount_norm);
            }
        }
    }
    if let Some(home) = dirs::home_dir() {
        let home_norm = home
            .to_string_lossy()
            .to_string()
            .trim_end_matches(|c| c == '/' || c == '\\')
            .to_string()
            .to_lowercase();
        if !allowed_mounts.contains(&home_norm) {
            allowed_mounts.push(home_norm);
        }
    }

    // Windows drive-letter/UNC quick acceptance
    #[cfg(target_os = "windows")]
    {
        let chars: Vec<char> = normalized.chars().collect();
        if let Some(idx) = chars.iter().position(|c| *c != '\\' && *c != '/') {
            if idx + 1 < chars.len() && chars[idx + 1] == ':' {
                return Ok(canonical);
            }
        }
        if normalized.starts_with("\\\\") {
            return Ok(canonical);
        }
    }

    // Otherwise match discovered mounts
    let mut allowed = allowed_mounts.iter().any(|m| {
        let m_with_sep = format!("{}{}", m, std::path::MAIN_SEPARATOR);
        normalized_lower.starts_with(m) || normalized_lower.starts_with(&m_with_sep)
    });

    if allowed {
        Ok(canonical)
    } else {
        Err("path is outside allowed locations".to_string())
    }
}

// Move / Rename (exposed as fs_move_by_session)
#[tauri::command]
pub fn fs_move_by_session(
    session_token: String,
    src_path: String,
    dst_path: String,
) -> Result<(), String> {
    let conn = crate::db::open_connection().map_err(|e| format!("db open: {}", e))?;
    let maybe_uid = crate::session::validate_session(&conn, &session_token)
        .map_err(|e| format!("session validation: {}", e))?;
    let uid = maybe_uid.ok_or_else(|| "invalid or expired session".to_string())?;

    // ensure admin
    let user = crate::db::get_user_by_id_row(&conn, uid)
        .map_err(|e| format!("db user lookup: {}", e))?
        .ok_or_else(|| "user not found".to_string())?;
    if user.role != "admin" {
        return Err("admin role required".into());
    }

    // canonicalize and allowlist parents similar to rename implementation
    let src_canon = std::fs::canonicalize(&src_path)
        .map_err(|e| format!("cannot canonicalize src_path '{}' : {}", src_path, e))?;
    let dst_parent = std::path::Path::new(&dst_path)
        .parent()
        .ok_or("invalid dst_path")?
        .to_path_buf();
    let dst_parent_canon = std::fs::canonicalize(&dst_parent)
        .map_err(|e| format!("cannot canonicalize dst parent: {}", e))?;

    // optional allowlist: require both under home or known mounts (reuse your home check)
    // if let Some(home) = dirs::home_dir() {
    //     if !src_canon.starts_with(&home) || !dst_parent_canon.starts_with(&home) {
    //         return Err("move denied: outside allowed locations".into());
    //     }
    // }

    // ensure destination doesn't already exist
    if std::path::Path::new(&dst_path).exists() {
        return Err("destination already exists".into());
    }

    std::fs::rename(&src_canon, &dst_path).map_err(|e| format!("move failed: {}", e))?;

    // audit
    let details = format!("move: {} -> {}", src_canon.to_string_lossy(), dst_path);
    let _ = crate::db::insert_audit_log(
        &conn,
        Some(uid),
        Some(&user.username),
        "fs_move",
        None,
        Some(&details),
    );

    Ok(())
}

// Copy (exposed as fs_copy_by_session) - copies files, for directories does a recursive copy
#[tauri::command]
pub fn fs_copy_by_session(
    session_token: String,
    src_path: String,
    dst_path: String,
) -> Result<(), String> {
    let conn = crate::db::open_connection().map_err(|e| format!("db open: {}", e))?;
    let maybe_uid = crate::session::validate_session(&conn, &session_token)
        .map_err(|e| format!("session validation: {}", e))?;
    let uid = maybe_uid.ok_or_else(|| "invalid or expired session".to_string())?;

    // ensure admin
    let user = crate::db::get_user_by_id_row(&conn, uid)
        .map_err(|e| format!("db user lookup: {}", e))?
        .ok_or_else(|| "user not found".to_string())?;
    if user.role != "admin" {
        return Err("admin role required".into());
    }

    // canonicalize src
    let src_canon = std::fs::canonicalize(&src_path)
        .map_err(|e| format!("cannot canonicalize src_path '{}' : {}", src_path, e))?;

    // ensure src exists
    let md = std::fs::metadata(&src_canon).map_err(|e| format!("stat error: {}", e))?;

    // don't allow copying into existing path
    if std::path::Path::new(&dst_path).exists() {
        return Err("destination already exists".into());
    }

    // helper for recursive dir copy
    fn copy_dir_recursive(src: &std::path::Path, dst: &std::path::Path) -> Result<(), String> {
        std::fs::create_dir_all(dst).map_err(|e| format!("create_dir_all: {}", e))?;
        for entry in std::fs::read_dir(src).map_err(|e| format!("read_dir: {}", e))? {
            let entry = entry.map_err(|e| format!("dir entry: {}", e))?;
            let file_type = entry.file_type().map_err(|e| format!("file_type: {}", e))?;
            let src_entry = entry.path();
            let dst_entry = dst.join(entry.file_name());
            if file_type.is_dir() {
                copy_dir_recursive(&src_entry, &dst_entry)?;
            } else {
                std::fs::copy(&src_entry, &dst_entry).map_err(|e| format!("copy file: {}", e))?;
            }
        }
        Ok(())
    }

    if md.is_file() {
        std::fs::copy(&src_canon, &dst_path).map_err(|e| format!("copy failed: {}", e))?;
    } else if md.is_dir() {
        let src_p = std::path::Path::new(&src_canon);
        let dst_p = std::path::Path::new(&dst_path);
        copy_dir_recursive(src_p, dst_p)?;
    } else {
        return Err("unsupported source type".into());
    }

    // audit
    let details = format!("copy: {} -> {}", src_canon.to_string_lossy(), dst_path);
    let _ = crate::db::insert_audit_log(
        &conn,
        Some(uid),
        Some(&user.username),
        "fs_copy",
        None,
        Some(&details),
    );

    Ok(())
}

/// Copy (less strict) - accepts optional session token (some fsClient candidates call this)
#[tauri::command]
pub fn fs_copy(
    session_token: Option<String>,
    src_path: String,
    dest_path: String,
) -> Result<(), String> {
    // If session provided, validate (but allow None in debug builds)
    if let Some(ref token) = session_token {
        let conn_check = crate::db::open_connection().map_err(|e| format!("db open: {}", e))?;
        let maybe_uid = crate::session::validate_session(&conn_check, token)
            .map_err(|e| format!("session validation: {}", e))?;
        let _ = maybe_uid.ok_or_else(|| "invalid session".to_string())?;
    } else if !cfg!(debug_assertions) {
        // In release builds require a session
        return Err("session required".into());
    }
    // Reuse strict implementation: require an admin in strict variant; for the loose variant we skip admin check,
    // but still perform the actual copy (for dev ease). Here we do the same copy logic but without audit user id when None.
    // For simplicity delegate to std::fs copy logic:
    let src_canon = std::fs::canonicalize(&src_path)
        .map_err(|e| format!("cannot canonicalize src '{}' : {}", src_path, e))?;
    if !src_canon.exists() {
        return Err(format!("source does not exist: {}", src_path));
    }
    if std::path::Path::new(&dest_path).exists() {
        return Err("destination already exists".into());
    }
    let md = std::fs::metadata(&src_canon).map_err(|e| format!("stat src error: {}", e))?;
    if md.is_dir() {
        // simple recursive copy (same logic as above)
        fn copy_dir_recursive(
            src: &std::path::Path,
            dst: &std::path::Path,
        ) -> std::result::Result<(), String> {
            std::fs::create_dir_all(dst).map_err(|e| format!("mkdir failed: {}", e))?;
            for entry in std::fs::read_dir(src).map_err(|e| format!("read_dir failed: {}", e))? {
                let entry = entry.map_err(|e| format!("read_dir entry: {}", e))?;
                let ft = entry.file_type().map_err(|e| format!("file_type: {}", e))?;
                let srcp = entry.path();
                let dstp = dst.join(entry.file_name());
                if ft.is_dir() {
                    copy_dir_recursive(&srcp, &dstp)?;
                } else {
                    std::fs::copy(&srcp, &dstp).map_err(|e| format!("copy file failed: {}", e))?;
                }
            }
            Ok(())
        }
        copy_dir_recursive(&src_canon, std::path::Path::new(&dest_path))?;
    } else {
        std::fs::copy(&src_canon, &dest_path).map_err(|e| format!("copy failed: {}", e))?;
    }

    // best-effort audit (no uid available for unauthenticated)
    if let Some(token) = session_token {
        if let Ok(conn) = crate::db::open_connection() {
            if let Ok(Some(uid)) = crate::session::validate_session(&conn, &token) {
                if let Ok(Some(user_row)) = crate::db::get_user_by_id_row(&conn, uid) {
                    let _ = crate::db::insert_audit_log(
                        &conn,
                        Some(uid),
                        Some(&user_row.username),
                        "fs_copy",
                        None,
                        Some(&format!("from:{} to:{}", src_path, dest_path)),
                    );
                }
            }
        }
    }

    Ok(())
}

/// Move (less strict) - accepts optional session token
#[tauri::command]
pub fn fs_move(
    session_token: Option<String>,
    src_path: String,
    dest_path: String,
) -> Result<(), String> {
    if let Some(ref token) = session_token {
        let conn_check = crate::db::open_connection().map_err(|e| format!("db open: {}", e))?;
        let maybe_uid = crate::session::validate_session(&conn_check, token)
            .map_err(|e| format!("session validation: {}", e))?;
        let _ = maybe_uid.ok_or_else(|| "invalid session".to_string())?;
    } else if !cfg!(debug_assertions) {
        return Err("session required".into());
    }

    let src_canon = std::fs::canonicalize(&src_path)
        .map_err(|e| format!("cannot canonicalize src '{}' : {}", src_path, e))?;
    if !src_canon.exists() {
        return Err("source does not exist".into());
    }
    if std::path::Path::new(&dest_path).exists() {
        return Err("destination already exists".into());
    }

    std::fs::rename(&src_canon, &dest_path).map_err(|e| format!("rename/move failed: {}", e))?;

    // best-effort audit if session provided
    if let Some(token) = session_token {
        if let Ok(conn) = crate::db::open_connection() {
            if let Ok(Some(uid)) = crate::session::validate_session(&conn, &token) {
                if let Ok(Some(user_row)) = crate::db::get_user_by_id_row(&conn, uid) {
                    let _ = crate::db::insert_audit_log(
                        &conn,
                        Some(uid),
                        Some(&user_row.username),
                        "fs_move",
                        None,
                        Some(&format!("from:{} to:{}", src_path, dest_path)),
                    );
                }
            }
        }
    }

    Ok(())
}

/// Make directory (admin)
#[tauri::command]
pub fn fs_mkdir_by_session(session_token: String, path: String) -> Result<(), String> {
    let conn = crate::db::open_connection().map_err(|e| format!("db open: {}", e))?;
    let maybe_uid = crate::session::validate_session(&conn, &session_token)
        .map_err(|e| format!("session validation: {}", e))?;
    let uid = maybe_uid.ok_or_else(|| "invalid session".to_string())?;
    let user = crate::db::get_user_by_id_row(&conn, uid)
        .map_err(|e| format!("db user lookup: {}", e))?
        .ok_or_else(|| "user not found".to_string())?;
    if user.role != "admin" {
        return Err("admin role required".into());
    }

    // canonicalize parent
    let parent = std::path::Path::new(&path)
        .parent()
        .ok_or("invalid path")?
        .to_path_buf();
    let _ = std::fs::canonicalize(&parent)
        .map_err(|e| format!("cannot canonicalize parent '{}' : {}", parent.display(), e))?;

    if std::path::Path::new(&path).exists() {
        return Err("path already exists".into());
    }

    std::fs::create_dir_all(&path).map_err(|e| format!("mkdir failed: {}", e))?;

    let _ = crate::db::insert_audit_log(
        &conn,
        Some(uid),
        Some(&user.username),
        "fs_mkdir",
        None,
        Some(&path),
    );
    Ok(())
}

/// Create file (admin) - optional content
#[tauri::command]
pub fn fs_create_file_by_session(
    session_token: String,
    path: String,
    content: Option<String>,
) -> Result<(), String> {
    let conn = crate::db::open_connection().map_err(|e| format!("db open: {}", e))?;
    let maybe_uid = crate::session::validate_session(&conn, &session_token)
        .map_err(|e| format!("session validation: {}", e))?;
    let uid = maybe_uid.ok_or_else(|| "invalid session".to_string())?;
    let user = crate::db::get_user_by_id_row(&conn, uid)
        .map_err(|e| format!("db user lookup: {}", e))?
        .ok_or_else(|| "user not found".to_string())?;
    if user.role != "admin" {
        return Err("admin role required".into());
    }

    // canonicalize parent
    let parent = std::path::Path::new(&path)
        .parent()
        .ok_or("invalid path")?
        .to_path_buf();
    let _ = std::fs::canonicalize(&parent)
        .map_err(|e| format!("cannot canonicalize parent '{}' : {}", parent.display(), e))?;

    if std::path::Path::new(&path).exists() {
        return Err("path already exists".into());
    }

    if let Some(data) = content {
        std::fs::write(&path, data.as_bytes()).map_err(|e| format!("write failed: {}", e))?;
    } else {
        // create empty file
        OpenOptions::new()
            .create_new(true)
            .write(true)
            .open(&path)
            .map_err(|e| format!("create file failed: {}", e))?;
    }

    let _ = crate::db::insert_audit_log(
        &conn,
        Some(uid),
        Some(&user.username),
        "fs_create_file",
        None,
        Some(&path),
    );
    Ok(())
}

#[tauri::command]
pub fn fs_delete_by_session(session_token: String, path: String) -> Result<(), String> {
    use std::path::PathBuf;

    let conn = crate::db::open_connection().map_err(|e| format!("db open: {}", e))?;
    let maybe_uid = crate::session::validate_session(&conn, &session_token)
        .map_err(|e| format!("session validation: {}", e))?;
    let uid = maybe_uid.ok_or_else(|| "invalid session".to_string())?;

    // ensure admin
    let user = crate::db::get_user_by_id_row(&conn, uid)
        .map_err(|e| format!("db user lookup: {}", e))?
        .ok_or_else(|| "user not found".to_string())?;
    if user.role != "admin" {
        return Err("admin role required".into());
    }

    // canonicalize
    let canonical = std::fs::canonicalize(&path)
        .map_err(|e| format!("cannot canonicalize path '{}' : {}", path, e))?;
    let canonical_str = canonical.to_string_lossy().to_string();

    // ❌ Removed allowlist (home directory restriction)
    // ---- BLOCK REMOVED ----
    // if let Some(home) = dirs::home_dir() {
    //     if !canonical.starts_with(&home) {
    //         return Err("delete denied: outside allowed locations".into());
    //     }
    // }

    // SAFETY: Prevent deleting the running binary
    if let Ok(current_exe) = std::env::current_exe() {
        if canonical == current_exe {
            return Err("delete denied: cannot delete running application binary".into());
        }
        if let Some(exe_parent) = current_exe.parent() {
            if canonical.starts_with(exe_parent) {
                return Err(
                    "delete denied: cannot delete files in application build directory".into(),
                );
            }
        }
    }

    // Prevent deleting project target directory (src-tauri/target)
    if let Ok(cur_dir) = std::env::current_dir() {
        let mut target_dir = cur_dir.clone();
        target_dir.push("src-tauri");
        target_dir.push("target");
        if canonical.starts_with(&target_dir) {
            return Err(
                "delete denied: cannot delete files inside project target directory".into(),
            );
        }
    }

    // Do the actual delete
    let md = std::fs::metadata(&canonical).map_err(|e| format!("stat error: {}", e))?;
    if md.is_file() {
        std::fs::remove_file(&canonical).map_err(|e| format!("remove_file: {}", e))?;
    } else {
        std::fs::remove_dir_all(&canonical).map_err(|e| format!("remove_dir_all: {}", e))?;
    }

    // audit log
    let _ = crate::db::insert_audit_log(
        &conn,
        Some(uid),
        Some(&user.username),
        "fs_delete",
        None,
        Some(&canonical_str),
    );

    Ok(())
}

// RENAME
#[tauri::command]
pub fn fs_rename_by_session(
    session_token: String,
    old_path: String,
    new_path: String,
) -> Result<(), String> {
    let conn = crate::db::open_connection().map_err(|e| format!("db open: {}", e))?;
    let maybe_uid = crate::session::validate_session(&conn, &session_token)
        .map_err(|e| format!("session validation: {}", e))?;
    let uid = maybe_uid.ok_or_else(|| "invalid session".to_string())?;

    let user = crate::db::get_user_by_id_row(&conn, uid)
        .map_err(|e| format!("db user lookup: {}", e))?
        .ok_or_else(|| "user not found".to_string())?;
    if user.role != "admin" {
        return Err("admin role required".into());
    }

    let old_canon = std::fs::canonicalize(&old_path)
        .map_err(|e| format!("cannot canonicalize old_path '{}' : {}", old_path, e))?;
    let new_canon_parent = std::path::Path::new(&new_path)
        .parent()
        .ok_or("invalid new_path")?
        .to_path_buf();
    let new_parent_canon = std::fs::canonicalize(&new_canon_parent)
        .map_err(|e| format!("cannot canonicalize new_path parent: {}", e))?;
    // optional allowlist checks
    // if let Some(home) = dirs::home_dir() {
    //     if !old_canon.starts_with(&home) || !new_parent_canon.starts_with(&home) {
    //         return Err("rename denied: outside allowed locations".into());
    //     }
    // }

    // ensure dest doesn't exist
    if std::path::Path::new(&new_path).exists() {
        return Err("destination already exists".into());
    }

    std::fs::rename(&old_canon, &new_path).map_err(|e| format!("rename failed: {}", e))?;

    // audit
    let details = format!("from: {} -> to: {}", old_canon.to_string_lossy(), new_path);
    let _ = crate::db::insert_audit_log(
        &conn,
        Some(uid),
        Some(&user.username),
        "fs_rename",
        None,
        Some(&details),
    );

    Ok(())
}

// TAG
#[tauri::command]
pub fn fs_tag_item_by_session(
    session_token: String,
    path: String,
    tag_id: String,
) -> Result<(), String> {
    let conn = crate::db::open_connection().map_err(|e| format!("db open: {}", e))?;
    let maybe_uid = crate::session::validate_session(&conn, &session_token)
        .map_err(|e| format!("session validation: {}", e))?;
    let uid = maybe_uid.ok_or_else(|| "invalid session".to_string())?;

    let user = crate::db::get_user_by_id_row(&conn, uid)
        .map_err(|e| format!("db user lookup: {}", e))?
        .ok_or_else(|| "user not found".to_string())?;
    if user.role != "admin" {
        return Err("admin role required".into());
    }

    // canonicalize path
    let canonical = std::fs::canonicalize(&path)
        .map_err(|e| format!("cannot canonicalize path '{}' : {}", path, e))?;

    // ensure table exists (idempotent)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS file_tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT NOT NULL,
            tag TEXT NOT NULL,
            created_by INTEGER,
            created_at INTEGER
        )",
        [],
    )
    .map_err(|e| format!("create table file_tags failed: {}", e))?;

    // canonical is a PathBuf from std::fs::canonicalize(&path)
    let mut canonical_str = canonical.to_string_lossy().to_string();

    // Strip Windows long-path prefix "\\?\" if present
    #[cfg(target_os = "windows")]
    {
        if canonical_str.starts_with("\\\\?\\") {
            canonical_str = canonical_str.trim_start_matches("\\\\?\\").to_string();
        }
        if canonical_str.starts_with("\\?\\") {
            canonical_str = canonical_str.trim_start_matches("\\?\\").to_string();
        }
        // Convert "\\?\\UNC\\server\\share" -> "\\server\\share"
        if canonical_str.to_lowercase().starts_with("unc\\") {
            canonical_str = canonical_str.trim_start_matches("UNC\\").to_string();
            if !canonical_str.starts_with("\\\\") {
                canonical_str = format!("\\\\{}", canonical_str);
            }
        }
    }
    // Remove any existing tags for this path (we want a single tag per file — replace semantics)
    conn.execute(
        "DELETE FROM file_tags WHERE path = ?1",
        params![canonical_str],
    )
    .map_err(|e| format!("delete existing tags failed: {}", e))?;
    // then insert canonical_str (not canonical.to_string_lossy())
    let now = chrono::Utc::now().timestamp();
    conn.execute(
        "INSERT INTO file_tags (path, tag, created_by, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![canonical_str, tag_id, uid, now],
    )
    .map_err(|e| format!("insert tag failed: {}", e))?;

    // audit
    let detail = format!("tag='{}' on {}", tag_id, canonical.to_string_lossy());
    let _ = crate::db::insert_audit_log(
        &conn,
        Some(uid),
        Some(&user.username),
        "fs_tag",
        None,
        Some(&detail),
    );

    Ok(())
}

/// List available drives / mount points using sysinfo.
/// Requires a valid session token (security).
#[tauri::command]
pub fn list_drives(session_token: String) -> Result<Vec<DriveInfo>, String> {
    // Validate session before returning anything
    let conn = crate::db::open_connection().map_err(|e| format!("db open error: {}", e))?;
    let maybe_uid = crate::session::validate_session(&conn, &session_token)
        .map_err(|e| format!("session validation error: {}", e))?;
    let _uid = maybe_uid.ok_or_else(|| "invalid or expired session".to_string())?;

    // Use sysinfo to get disks
    let mut sys = System::new_all();
    sys.refresh_disks_list();
    sys.refresh_disks();

    // current unix epoch seconds (use as "scan now" if you want)
    let now_epoch: Option<i64> = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .ok()
        .map(|d| d.as_secs() as i64);

    let mut out: Vec<DriveInfo> = Vec::new();
    for disk in sys.disks() {
        let mount = disk.mount_point().to_string_lossy().to_string();
        let fs = String::from_utf8_lossy(disk.file_system()).to_string();
        let total = disk.total_space();
        let avail = disk.available_space();
        // Try to use a user-friendly label: on Windows, mount_point is like "C:\"
        let label = mount.clone();
        let id = mount.clone();

        out.push(DriveInfo {
            id,
            label,
            mount_point: mount,
            total_bytes: total,
            available_bytes: avail,
            file_system: fs,
            // record now as last_scan_epoch — or set None if prefer not to
            last_scan_epoch: now_epoch,
        });
    }

    // Additionally include the user's home directory as a "drive" entry (helpful)
    if let Some(home) = dirs::home_dir() {
        let home_str = home.to_string_lossy().to_string();
        // Avoid duplicates
        if !out.iter().any(|d| d.mount_point == home_str) {
            // Attempt to get metadata for disk space via std::fs::metadata? Keep simple with zeros
            out.push(DriveInfo {
                id: format!("home:{}", home_str),
                label: format!("Home · {}", home_str),
                mount_point: home_str.clone(),
                total_bytes: 0,
                available_bytes: 0,
                file_system: String::from(""),
                last_scan_epoch: None,
            });
        }
    }

    Ok(out)
}

#[tauri::command]
pub fn fs_list_tags_by_session(
    session_token: Option<String>,
    path: String,
) -> Result<Vec<(i64, String, Option<i64>, Option<i64>)>, String> {
    let conn = crate::db::open_connection().map_err(|e| format!("db open: {}", e))?;
    // validate session (only allow authenticated listing)
    // let maybe_uid = crate::session::validate_session(&conn, &session_token)
    //     .map_err(|e| format!("session validation: {}", e))?;
    // let _uid = maybe_uid.ok_or_else(|| "invalid or expired session".to_string())?;

    // Canonicalize incoming path so it mostly matches stored canonical value
    // (note: canonicalize can change slashes and add/remove \\?\ prefix on windows)
    let canonical = std::fs::canonicalize(&path)
        .map_err(|e| format!("cannot canonicalize path '{}' : {}", path, e))?;
    let mut canonical_str = canonical.to_string_lossy().to_string();

    // Build tolerant alternate variants:
    // - strip leading "\\?\" if present
    // - normalized forward-slash variant
    #[cfg(target_os = "windows")]
    {
        if canonical_str.starts_with("\\\\?\\") {
            canonical_str = canonical_str.trim_start_matches("\\\\?\\").to_string();
        }
    }
    // forward slash normalized form
    let canonical_forward = canonical_str.replace("\\", "/");

    // We'll try a SQL query that normalizes both DB and param by replacing backslashes with slashes.
    // Return columns: id, tag, created_by, created_at
    let sql = r#"
        SELECT ft.id, ft.tag, ft.created_by, ft.created_at
        FROM file_tags ft
        WHERE replace(ft.path, '\', '/') = replace(?1, '\', '/')
           OR ft.path = ?1
           OR ft.path = ?2
        ORDER BY ft.created_at DESC
    "#;

    // Prepare and run the statement
    let mut stmt = conn
        .prepare(sql)
        .map_err(|e| format!("prepare error: {}", e))?;
    let rows = stmt
        .query_map(rusqlite::params![canonical_str, canonical_forward], |row| {
            let id: i64 = row.get(0)?;
            let tag: String = row.get(1)?;
            let created_by: Option<i64> = row.get(2)?;
            let created_at: Option<i64> = row.get(3)?;
            Ok((id, tag, created_by, created_at))
        })
        .map_err(|e| format!("query_map error: {}", e))?;

    let mut out: Vec<(i64, String, Option<i64>, Option<i64>)> = Vec::new();
    for r in rows {
        if let Ok(entry) = r {
            out.push(entry);
        }
    }

    Ok(out)
}

#[tauri::command]
pub fn fs_untag_item_by_session(
    session_token: String,
    path: String,
    tag_id: String,
) -> Result<(), String> {
    let conn = crate::db::open_connection().map_err(|e| format!("db open: {}", e))?;
    let maybe_uid = crate::session::validate_session(&conn, &session_token)
        .map_err(|e| format!("session validation: {}", e))?;
    let uid = maybe_uid.ok_or_else(|| "invalid or expired session".to_string())?;

    let user = crate::db::get_user_by_id_row(&conn, uid)
        .map_err(|e| format!("db user lookup: {}", e))?
        .ok_or_else(|| "user not found".to_string())?;
    if user.role != "admin" {
        return Err("admin role required".into());
    }

    // Canonicalize path (like insertion does)
    let canonical = std::fs::canonicalize(&path)
        .map_err(|e| format!("cannot canonicalize path '{}' : {}", path, e))?;
    let mut canonical_str = canonical.to_string_lossy().to_string();

    // --- Normalize Windows long-path / UNC forms to match insertion logic ---
    #[cfg(target_os = "windows")]
    {
        // Trim leading long-path prefix "\\?\"
        if canonical_str.starts_with("\\\\?\\") {
            canonical_str = canonical_str.trim_start_matches("\\\\?\\").to_string();
        }
        // For UNC long-path form "\\?\UNC\server\share" we expect "\\server\share"
        if canonical_str.to_lowercase().starts_with("unc\\") {
            canonical_str = canonical_str.trim_start_matches("UNC\\").to_string();
            if !canonical_str.starts_with("\\\\") {
                canonical_str = format!("\\\\{}", canonical_str);
            }
        }
    }

    // Use replace to normalize slash style in SQL comparison so stored variations still match.
    let res = conn.execute(
        "DELETE FROM file_tags WHERE replace(path, '\\\\', '/') = replace(?1, '\\\\', '/') AND tag = ?2",
        params![canonical_str, tag_id],
    ).map_err(|e| format!("delete tag failed: {}", e))?;

    // Optional: if nothing deleted, log for debugging (non-fatal)
    if res == 0 {
        // helpful debug message for dev; you can remove or convert to proper audit log if desired
        eprintln!(
            "[fs_untag_item_by_session] no rows deleted for tag='{}' path='{}' (canonical='{}')",
            tag_id, path, canonical_str
        );
    }

    // audit
    let detail = format!("untag='{}' on {}", tag_id, path);
    let _ = crate::db::insert_audit_log(
        &conn,
        Some(uid),
        Some(&user.username),
        "fs_untag",
        None,
        Some(&detail),
    );

    Ok(())
}

#[tauri::command]
pub fn get_session_user(session_token: String) -> Result<Option<(i64, String, String)>, String> {
    let conn = crate::db::open_connection().map_err(|e| format!("db open: {}", e))?;
    let maybe_uid = crate::session::validate_session(&conn, &session_token)
        .map_err(|e| format!("session validation: {}", e))?;
    if let Some(uid) = maybe_uid {
        if let Some(urow) = crate::db::get_user_by_id_row(&conn, uid)
            .map_err(|e| format!("db user lookup: {}", e))?
        {
            return Ok(Some((urow.id, urow.username.clone(), urow.role.clone())));
        }
    }
    Ok(None)
}

/// Search indexed files by tag (global). session_token optional (if provided it will be validated).
#[tauri::command]
pub fn search_files_by_tag(
    session_token: Option<String>,
    tag: String,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<FileEntry>, String> {
    // If token supplied, validate session (non-fatal if None)
    if let Some(ref token) = session_token {
        let conn_check =
            crate::db::open_connection().map_err(|e| format!("db open (session check): {}", e))?;
        let maybe_uid = crate::session::validate_session(&conn_check, token)
            .map_err(|e| format!("session validation: {}", e))?;
        let _ = maybe_uid.ok_or_else(|| "invalid session".to_string())?;
    }

    let conn = crate::db::open_connection().map_err(|e| format!("db open: {}", e))?;
    let lim = limit.unwrap_or(200);
    let off = offset.unwrap_or(0);

    // Ensure files_index exists (and is FTS-populated) — safe no-op if already present
    ensure_files_index_tables(&conn).map_err(|e| format!("ensure tables: {}", e))?;

    // Use replace to normalize slashes for matching (handles Windows backslash vs stored path)
    // LEFT JOIN so tag entries without index rows still show (but we'll filter those out later if needed).
    let sql = r#"
        SELECT
          COALESCE(fi.path, ft.path) as path,
          COALESCE(fi.name,
                   substr(ft.path,
                          -- attempt to take basename after last slash/backslash
                          (CASE
                             WHEN instr(ft.path, '/') > 0 THEN instr(ft.path, '/') + (
                                  length(ft.path) - instr(ft.path, '/') + 1) - (length(ft.path) - instr(ft.path, '/'))
                             ELSE 1
                           END)
                          )
                   , ft.path) as name,
          COALESCE(fi.file_type, 'file') as file_type,
          fi.size,
          fi.indexed_at
        FROM file_tags ft
        LEFT JOIN files_index fi
          ON replace(ft.path, '\\', '/') = replace(fi.path, '\\', '/')
        WHERE ft.tag = ?1
        ORDER BY ft.created_at DESC
        LIMIT ?2 OFFSET ?3
    "#;

    let mut stmt = conn
        .prepare(sql)
        .map_err(|e| format!("prepare error: {}", e))?;
    let rows = stmt
        .query_map(params![tag, lim, off], |row| {
            let path: String = row.get(0)?;
            let name: String = row.get(1)?;
            let file_type: String = row.get(2)?;
            let size: Option<i64> = row.get(3)?;
            let indexed_at: Option<i64> = row.get(4)?;
            Ok(FileEntry {
                name,
                is_dir: file_type == "dir",
                size,
                modified: indexed_at,
                path,
            })
        })
        .map_err(|e| format!("query_map error: {}", e))?;

    let mut out = Vec::new();
    for r in rows {
        if let Ok(e) = r {
            out.push(e);
        }
    }
    Ok(out)
}
