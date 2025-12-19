-- src-tauri/migrations/0003_add_unique_path.sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_files_index_path_unique
ON files_index(path);