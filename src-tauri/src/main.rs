// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod admin_backend;
mod audit;
mod auth_backend;
mod db;
mod fs_ops;
mod security;
mod session;
mod session_store; // NEW
mod user_backend;

use admin_backend::{
    admin_create_user_cmd, admin_delete_user_cmd, admin_get_user_cmd, admin_list_users_cmd,
    admin_update_user_cmd,
};
use audit::{admin_list_audit_logs, get_portal_audit_logs, get_watchlist_blocked_attempts}; // your renamed command in audit.rs
use auth_backend::{
    auth_login, auth_logout, auth_register, get_profile_by_session, validate_session,
};
use fs_ops::{
    fs_delete_by_session, fs_rename_by_session, fs_tag_item_by_session, get_files_per_drive,
    get_index_status, get_indexing_by_drive_and_type, get_storage_info_with_scan, index_path,
    index_path_start, list_drives, open_file_by_session, open_path_by_session, read_dir,
    recent_items, search_files,index_all_drives_start, get_indexing_summary_global, get_session_user, fs_list_tags_by_session, search_files_by_tag, fs_untag_item_by_session,fs_move_by_session, fs_move, fs_copy_by_session, fs_copy, fs_mkdir_by_session,fs_create_file_by_session
};
use session_store::{session_store_clear, session_store_get, session_store_set};
use user_backend::{
    admin_can_create_user_cmd, admin_can_delete_user_cmd, admin_can_list_users_cmd,
    admin_can_update_user_cmd, update_profile_by_session,
};

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // auth
            auth_login,
            auth_register,
            auth_logout,
            validate_session,
            get_profile_by_session,
            // admin
            admin_list_users_cmd,
            admin_get_user_cmd,
            admin_create_user_cmd,
            admin_update_user_cmd,
            admin_delete_user_cmd,
            update_profile_by_session,
            admin_can_list_users_cmd,
            admin_can_create_user_cmd,
            admin_can_delete_user_cmd,
            admin_can_update_user_cmd,
            // audit (admin)
            admin_list_audit_logs,
            get_portal_audit_logs,
            get_watchlist_blocked_attempts,
            // session store (OS keyring)
            session_store_set,
            session_store_get,
            session_store_clear,
            // filesystem
            list_drives,
            read_dir,
            recent_items,
            open_path_by_session,
            open_file_by_session,
            fs_delete_by_session,
            fs_rename_by_session,
            fs_tag_item_by_session,
            get_files_per_drive,
            get_indexing_by_drive_and_type,
            get_storage_info_with_scan,
            search_files,
            index_path,
            index_path_start,
            get_index_status,
            index_all_drives_start,
            get_indexing_summary_global,
            get_session_user,
            fs_list_tags_by_session,
            search_files_by_tag,
            fs_untag_item_by_session,
            fs_move_by_session, fs_move, fs_copy_by_session, fs_copy, fs_mkdir_by_session,fs_create_file_by_session
            // fs_api
        ])
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
