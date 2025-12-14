// src/components/modals/UsersRosterModal.jsx
import React from 'react';
import { motion } from 'framer-motion';

function formatLastLogin(v) {
  if (v == null) return '—';
  if (typeof v === 'number') {
    try {
      return new Date(v * 1000).toLocaleString();
    } catch {
      return String(v);
    }
  }
  // string: try parse ISO; if not parseable return as-is
  const parsed = Date.parse(v);
  if (!Number.isNaN(parsed)) return new Date(parsed).toLocaleString();
  return String(v);
}

export default function UsersRosterModal({
  open,
  onClose,
  admins = [],
  users = [],
}) {
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: 10, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="relative z-10 w-[min(960px,95%)] max-h-[85vh] overflow-hidden rounded-2xl border border-[var(--border-dark-soft,#1f2937)] bg-slate-900/95 p-4 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-sky-300">
            Registered Admins & Users
          </h3>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-slate-300 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="grid max-h-[70vh] gap-4 overflow-auto text-sm text-slate-200 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold text-sky-300">Admins</p>
            <table className="w-full text-xs">
              <thead className="border-b border-slate-800/70 text-slate-400">
                <tr>
                  <th className="py-1 text-left">Name</th>
                  <th className="py-1 text-left">Role</th>
                  <th className="py-1 text-left">Username</th>
                  <th className="py-1 text-right">Last Login</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((u) => (
                  <tr
                    key={u.id ?? u.username ?? u.name}
                    className="border-b border-slate-800/40 text-slate-200"
                  >
                    <td className="py-1">{u.name ?? '—'}</td>
                    <td className="py-1 text-slate-400">{u.role ?? '—'}</td>
                    <td className="py-1 text-slate-400">{u.username ?? '—'}</td>
                    <td className="py-1 text-right text-slate-400">
                      {formatLastLogin(u.lastLogin ?? u.last_login ?? u.last_login_epoch)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-sky-300">Users</p>
            <table className="w-full text-xs">
              <thead className="border-b border-slate-800/70 text-slate-400">
                <tr>
                  <th className="py-1 text-left">Name</th>
                  <th className="py-1 text-left">Role</th>
                  <th className="py-1 text-left">Username</th>
                  <th className="py-1 text-right">Last Login</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id ?? u.username ?? u.name}
                    className="border-b border-slate-800/40 text-slate-200"
                  >
                    <td className="py-1">{u.name ?? '—'}</td>
                    <td className="py-1 text-slate-400">{u.role ?? '—'}</td>
                    <td className="py-1 text-slate-400">{u.username ?? '—'}</td>
                    <td className="py-1 text-right text-slate-400">
                      {formatLastLogin(u.lastLogin ?? u.last_login ?? u.last_login_epoch)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-3 text-[0.7rem] text-slate-400">
          Tauri: a command like{' '}
          <span className="font-mono text-sky-300">get_registered_users_with_roles()</span>{' '}
          can drive this view, and you can extend it with filters for{' '}
          <span className="font-mono">"active-last-7d"</span>,{' '}
          <span className="font-mono">"active-last-30d"</span>, etc.
        </p>
      </motion.div>
    </motion.div>
  );
}
