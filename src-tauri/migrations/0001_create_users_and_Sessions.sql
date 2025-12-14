-- src-tauri/migrations/0001_create_users_and_Sessions.sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  created_at INTEGER NOT NULL,
  last_login INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  revoked INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  actor_user_id INTEGER, -- nullable (system)
  actor_username TEXT,
  action TEXT NOT NULL,
  target_type TEXT, -- e.g. 'user','file'
  target_id TEXT,
  details TEXT,
  FOREIGN KEY(actor_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS failed_logins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  ip TEXT,
  attempted_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS login_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  username TEXT,
  success INTEGER NOT NULL,
  ip TEXT,
  detail TEXT
);
