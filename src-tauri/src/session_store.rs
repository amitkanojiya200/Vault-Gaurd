// src-tauri/src/session_store.rs
use keyring::Entry;
use tauri::command;

/// Store a session token in the OS keyring under service "vaultguard" and the provided `key`.
/// Example: key = "vaultguard_current" or "session_token:user123"
#[command]
pub fn session_store_set(key: String, token: String) -> Result<bool, String> {
    let svc = "vaultguard";
    let entry = Entry::new(svc, &key);
    entry
        .set_password(&token)
        .map_err(|e| format!("Failed to set password in keyring: {}", e))?;
    Ok(true)
}

/// Retrieve a session token from the OS keyring for the given `key`.
#[command]
pub fn session_store_get(key: String) -> Result<Option<String>, String> {
    let svc = "vaultguard";
    let entry = Entry::new(svc, &key);
    match entry.get_password() {
        Ok(pw) => Ok(Some(pw)),
        Err(e) => {
            let s = format!("{}", e);
            // treat common "not found" variants as Ok(None)
            if s.contains("No entry found")
                || s.contains("not found")
                || s.contains("The specified item could not be found")
            {
                Ok(None)
            } else {
                Err(format!("Failed to get password from keyring: {}", e))
            }
        }
    }
}

/// Clear (delete) a stored token from the OS keyring for the given `key`.
#[command]
pub fn session_store_clear(key: String) -> Result<bool, String> {
    let svc = "vaultguard";
    let entry = Entry::new(svc, &key);
    match entry.delete_password() {
        Ok(_) => Ok(true),
        Err(e) => {
            // If the entry does not exist, treat as success (idempotent)
            let s = format!("{}", e);
            if s.contains("No entry found") || s.contains("not found") {
                Ok(true)
            } else {
                Err(format!("Failed to delete password from keyring: {}", e))
            }
        }
    }
}
