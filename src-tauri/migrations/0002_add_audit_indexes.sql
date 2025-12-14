-- src-tauri/src/migrations/0002_add_audit_indexes.sql
PRAGMA foreign_keys = ON;

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user_id ON audit_logs(target_user_id);
