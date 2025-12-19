use crate::fs_ops::{doc_type_for_path, normalize_drive_for_storage};
use notify::event::{ModifyKind, RenameMode};
use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use rusqlite::params;
use std::path::PathBuf;
use std::sync::mpsc::channel;
use tauri::Emitter;
use tauri::{AppHandle, Manager};

/// Emit a filesystem-change signal to the frontend
fn emit_fs_event(app: &AppHandle, kind: &str, path: &str) {
    let _ = app.emit(
        "fs:changed",
        serde_json::json!({
            "kind": kind,
            "path": path,
            "ts": chrono::Utc::now().timestamp()
        }),
    );
}

pub fn start_fs_watcher(
    roots: Vec<PathBuf>,
    db_path: PathBuf,
    app: AppHandle,
) -> Result<(), String> {
    std::thread::spawn(move || loop {
        if let Err(e) = run_watcher_once(roots.clone(), db_path.clone(), app.clone()) {
            eprintln!("[fs_watch] watcher crashed: {}", e);
            std::thread::sleep(std::time::Duration::from_secs(3));
            eprintln!("[fs_watch] restarting watcher...");
        }
    });

    Ok(())
}
fn run_watcher_once(roots: Vec<PathBuf>, db_path: PathBuf, app: AppHandle) -> Result<(), String> {
    let (tx, rx) = channel();

    let mut watcher: RecommendedWatcher = Watcher::new(tx, notify::Config::default())
        .map_err(|e| format!("watcher init failed: {}", e))?;

    for root in &roots {
        watcher
            .watch(root, RecursiveMode::Recursive)
            .map_err(|e| format!("watch failed on {}: {}", root.display(), e))?;
    }

    let conn = rusqlite::Connection::open(db_path).map_err(|e| format!("db open failed: {}", e))?;

    for evt in rx {
        match evt {
            Ok(event) => handle_event(&conn, &app, event),
            Err(e) => return Err(format!("watch channel error: {}", e)),
        }
    }

    Err("watcher loop exited unexpectedly".into())
}

fn normalize(p: &PathBuf) -> String {
    let mut s = p.to_string_lossy().to_string();

    #[cfg(target_os = "windows")]
    {
        if s.starts_with("\\\\?\\") {
            s = s.trim_start_matches("\\\\?\\").to_string();
        }
        if s.to_lowercase().starts_with("unc\\") {
            s = s.trim_start_matches("UNC\\").to_string();
            if !s.starts_with("\\\\") {
                s = format!("\\\\{}", s);
            }
        }
    }

    s
}

fn handle_event(conn: &rusqlite::Connection, app: &AppHandle, event: Event) {
    let now = chrono::Utc::now().timestamp();

    match event.kind {
        // ---------- DELETE ----------
        EventKind::Remove(_) => {
            for p in event.paths {
                let path_str = normalize(&p);

                let _ = conn.execute("DELETE FROM files_index WHERE path = ?1", params![path_str]);

                emit_fs_event(app, "delete", &path_str);
            }
        }

        // ---------- CREATE ----------
        EventKind::Create(_) => {
            for p in event.paths {
                let canonical = std::fs::canonicalize(&p).unwrap_or(p.clone());
                let path_str = normalize(&canonical);

                let name = canonical
                    .file_name()
                    .map(|s| s.to_string_lossy().to_string())
                    .unwrap_or_default();

                let is_dir = canonical.is_dir();
                let size = if !is_dir {
                    std::fs::metadata(&canonical).ok().map(|m| m.len() as i64)
                } else {
                    None
                };

                let doc_type = doc_type_for_path(&path_str, is_dir);
                let drive = normalize_drive_for_storage(&path_str);

                let _ = conn.execute(
                    "INSERT INTO files_index (path, name, file_type, doc_type, size, indexed_at, drive)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
                     ON CONFLICT(path)
                     DO UPDATE SET
                       indexed_at = excluded.indexed_at,
                       size = excluded.size",
                    params![
                        path_str,
                        name,
                        if is_dir { "dir" } else { "file" },
                        doc_type,
                        size,
                        now,
                        drive
                    ],
                );

                emit_fs_event(app, "create", &path_str);
            }
        }

        // ---------- RENAME / MOVE ----------
        EventKind::Modify(ModifyKind::Name(RenameMode::Both)) => {
            if event.paths.len() == 2 {
                let old = normalize(&event.paths[0]);
                let new = normalize(&event.paths[1]);

                let _ = conn.execute(
                    "UPDATE files_index SET path = ?1, name = ?2 WHERE path = ?3",
                    params![
                        new,
                        PathBuf::from(&new)
                            .file_name()
                            .unwrap_or_default()
                            .to_string_lossy(),
                        old
                    ],
                );

                emit_fs_event(app, "move", &format!("{} -> {}", old, new));
            }
        }

        _ => {}
    }
}
