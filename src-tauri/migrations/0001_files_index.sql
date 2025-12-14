-- src-tauri/migrations/0002_files_index.sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS files_index (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  drive TEXT,
  path TEXT NOT NULL,
  file_type TEXT,
  size INTEGER,
  indexed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_files_index_drive ON files_index(drive);
CREATE INDEX IF NOT EXISTS idx_files_index_indexed_at ON files_index(indexed_at);
