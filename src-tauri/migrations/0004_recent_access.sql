PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS recent_access (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,         -- NULL if anonymous
  path TEXT NOT NULL,
  accessed_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_recent_access_user_path_ts ON recent_access(user_id, accessed_at);
