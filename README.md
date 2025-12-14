📘 PRABAL – Secure Local File Management Software

Offline. Secure. Intelligent. Mission-Ready.

PRABAL is a dedicated desktop application built exclusively for Indian Coast Guard operations. It provides rapid, secure, offline access to local system files — from operational documents and intelligence reports to logs, training resources, and multimedia.

Designed for sensitive environments, PRABAL ensures no internet dependency, strict role-based control, and smart, contextual search across all connected storage devices.

🚀 Purpose & Mission

PRABAL is a mission-critical file discovery & management platform enabling personnel to:
Quickly retrieve operational files
Search intelligently across all drives
Maintain data integrity
Enforce user roles & policies
Preserve full audit visibility
Everything operates locally & offline for maximum security.
🎯 Core Objectives
⚡ Streamlined document retrieval
🔍 Smart, contextual search
🔒 Strict offline security with RBAC
🖥️ Clean, intuitive interface
🛠️ Full admin governance dashboard

⚙️ How PRABAL Works
1 — System Connection
Automatically syncs with:
Local drives (C:/ D:/ E:)
External USB devices
Secure NAS / local network storage
Operation-critical folders
All within the Coast Guard’s secured environment.

2 — Intelligent Indexing
Indexes:
PDFs, Docs, Excel
Images, Videos
Logs, Text files
Structured data
Builds a secure local index respecting permissions.

3 — Smart Search
Search via:
Names, types, dates, size, locations
File content
Natural language queries
“patrol reports 2024”
“SAR logs near Gujarat coast”
Uses semantic search & contextual ranking.

4 — Results & Quick Actions
Displays metadata, paths, previews, and allows:
Open / Locate
Copy / Move
Policy-protected Delete
Optimized for rapid response.

🧠 Core Features
🔍 Smart File Indexing

Auto-detects files across all drives
Maintains a constantly updated repository
Tracks additions, edits, deletions in real time

⚡ Fast Search
Search by name, type, date, size, drive/location — retrieving thousands of files in milliseconds.

📚 Content-Based Search
Search inside PDFs, DOCX, XLSX, TXT, JSON, logs, and more.

🤖 Search Intelligence
Semantic understanding
AI auto-tagging by category, subject, operational relevance

🔐 Admin & User Management
🛡️ Role-Based Access Control

Admin
Manage users & roles
Configure indexing rules
Control drive/folder access
Set operation permissions
USB/media controls
View analytics & system health
Manage security policies
Standard User
Search & access allowed files
Perform permitted actions

📊 Admin Dashboard

User management (add/edit/disable)
Permission control
System overview & indexing status
Storage insights
Scan schedules

🔒 Security & Policy Controls

Drive access rules
Approval workflows
Log retention
USB/media restrictions
Activity lockout

📈 Audit & Activity Insights

Monitor:
File operations
Active users
Suspicious patterns
Trends & heatmaps

📜 Full Audit Logs

Tracks:
Deletions (who, when, file path)
Updates (rename, move, versioning)
Opens/Exports
Copy/Move operations:
Filtered by user, drive, date, operation type, category, etc.

🧩 Tech Stack

React + Vite
Tauri (offline desktop)
Node.js (file operations)
SQLite / LowDB / custom local store
Chart.js (analytics)
GSAP + Framer Motion
Tesseract / PDF.js / doc parsers

🚀 Why PRABAL?

100% Offline
Built for Coast Guard workflows
High security with RBAC & audit trails
Lightning-fast indexing & search
Centralized file intelligence
Full admin control & governance

cmds
npm install @tauri-apps/api
Phase 1 – Install Rust & Tauri prerequisites
1. Install Rust (one-time)

On Windows (PowerShell):

winget install Rustlang.Rustup


Then restart the terminal and verify:

rustc -vV
cargo -V


If you’re on macOS/Linux, use:

curl https://sh.rustup.rs -sSf | sh

2. Install Tauri CLI (for your React project)

Inside your project root:

npm install -D @tauri-apps/cli


This adds Tauri CLI as a dev dependency.
No Rust code yet, just tooling.

Phase 2 – Initialize Tauri in your existing React app

Still in your project root:

npx tauri init


It will ask a few questions. Answer like this (for your setup):

“What is your app name?”
→ PRABAL (or whatever you like)

“What should the window title be?”
→ PRABAL

“Where are your web assets (dist)?”
If you use Vite (default):
→ dist

“What is the dev path?”
If you run npm run dev and it starts on port 5173:
→ http://localhost:5173

Tauri will then create a folder:

src-tauri/
  ├─ src/
  │   └─ main.rs      ← auto-generated, you don’t touch now
  ├─ tauri.conf.json
  └─ Cargo.toml


You do not need to write main.rs yourself. It’s already valid.

Phase 3 – Add Tauri helper scripts to package.json

Open package.json and add a “tauri” script (if it isn’t there already):

{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "tauri": "tauri"
  }
}


Now you can run Tauri from npm.

Phase 4 – Run your app as a desktop app for the first time

You’ll use two terminals:

Terminal 1 – Start your React dev server
npm run dev


Keep it running.

Terminal 2 – Start Tauri dev
npm run tauri dev









use tauri::{command, Manager};
use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub file_type: String,
    pub size: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub files: Vec<FileEntry>,
    pub total_count: usize,
}

// Command to search files in a directory
#[command]
fn search_files(directory: String, query: String) -> Result<SearchResult, String> {
    let base_path = PathBuf::from(directory);
    if !base_path.exists() {
        return Err("Directory does not exist".to_string());
    }

    let mut results = Vec::new();
    
    search_files_recursive(&base_path, &query, &mut results)?;

    Ok(SearchResult {
        total_count: results.len(),
        files: results,
    })
}

fn search_files_recursive(
    path: &PathBuf,
    query: &str,
    results: &mut Vec<FileEntry>,
) -> Result<(), String> {
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let file_path = entry.path();
            
            if file_path.is_dir() {
                // Recursively search subdirectories
                search_files_recursive(&file_path, query, results)?;
            } else if let Some(file_name) = file_path.file_name().and_then(|n| n.to_str()) {
                // Case-insensitive search in filename
                if file_name.to_lowercase().contains(&query.to_lowercase()) {
                    if let Ok(metadata) = fs::metadata(&file_path) {
                        let file_ext = file_path
                            .extension()
                            .and_then(|ext| ext.to_str())
                            .unwrap_or("unknown")
                            .to_string();

                        results.push(FileEntry {
                            name: file_name.to_string(),
                            path: file_path.to_string_lossy().to_string(),
                            file_type: file_ext,
                            size: metadata.len(),
                        });
                    }
                }
            }
        }
    }
    
    Ok(())
}

// Command to open file with default system application
#[command]
fn open_file_with_default_app(file_path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        opener::open(file_path).map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&file_path)
            .output()
            .map_err(|e| e.to_string())?;
    }
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&file_path)
            .output()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

// Command to read file and return as base64 for embedding
#[command]
async fn read_file_as_base64(file_path: String) -> Result<String, String> {
    let path = PathBuf::from(&file_path);
    
    if !path.exists() {
        return Err("File does not exist".to_string());
    }
    
    let content = fs::read(&path).map_err(|e| e.to_string())?;
    let base64_content = base64::encode(&content);
    
    // Determine MIME type based on file extension
    let mime_type = match path.extension().and_then(|ext| ext.to_str()) {
        Some("pdf") => "application/pdf",
        Some("ppt") | Some("pptx") => "application/vnd.ms-powerpoint",
        Some("doc") | Some("docx") => "application/msword",
        Some("mp4") => "video/mp4",
        Some("avi") => "video/x-msvideo",
        Some("mov") => "video/quicktime",
        _ => "application/octet-stream",
    };
    
    Ok(format!("data:{};base64,{}", mime_type, base64_content))
}

// Command to get list of all files in training directory
#[command]
fn get_training_files(base_directory: String) -> Result<Vec<FileEntry>, String> {
    let base_path = PathBuf::from(base_directory);
    let mut files = Vec::new();
    
    scan_training_directory(&base_path, &mut files)?;
    
    Ok(files)
}

fn scan_training_directory(path: &PathBuf, files: &mut Vec<FileEntry>) -> Result<(), String> {
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let file_path = entry.path();
            
            if file_path.is_dir() {
                scan_training_directory(&file_path, files)?;
            } else if let (Some(file_name), Ok(metadata)) = (
                file_path.file_name().and_then(|n| n.to_str()),
                fs::metadata(&file_path)
            ) {
                let file_ext = file_path
                    .extension()
                    .and_then(|ext| ext.to_str())
                    .unwrap_or("unknown")
                    .to_string();

                // Only include supported file types
                if matches!(
                    file_ext.as_str(),
                    "pdf" | "ppt" | "pptx" | "doc" | "docx" | "mp4" | "avi" | "mov"
                ) {
                    files.push(FileEntry {
                        name: file_name.to_string(),
                        path: file_path.to_string_lossy().to_string(),
                        file_type: file_ext,
                        size: metadata.len(),
                    });
                }
            }
        }
    }
    
    Ok(())
}

Dependencies :- 
[dependencies]
tauri = { version = "1.0", features = ["api-all"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
base64 = "0.21"
opener = "0.6""# Vault-Gaurd" 
