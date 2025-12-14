-- src-tauri/migrations/0003_storage_scans.sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS storage_scans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  drive TEXT NOT NULL,
  total_bytes INTEGER,
  used_bytes INTEGER,
  available_bytes INTEGER,
  scanned_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_storage_scans_drive_scanned_at ON storage_scans(drive, scanned_at);
