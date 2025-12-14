// ../components/modals/WatchlistActivityModal.jsx
import React from 'react';
import { motion } from 'framer-motion';

export default function WatchlistActivityModal({ open, onClose, logs = [] }) {
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
        className="relative z-10 w-[min(900px,95%)] max-h-[80vh] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/95 dark:shadow-black/40"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-sky-300">
            Watchlist Users · 24h Activity
          </h3>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Close
          </button>
        </div>

        <p className="mb-2 text-xs text-slate-600 dark:text-slate-400">
          Activity timeline for users currently on the Watchlist (login, logout,
          file operations). Data source will be PRABAL audit logs via
          Tauri.
        </p>

        <div className="max-h-[60vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50/90 dark:border-slate-800/80 dark:bg-slate-950/70">
          <table className="w-full text-xs text-slate-800 dark:text-slate-200">
            <thead className="bg-slate-100 text-slate-600 dark:bg-slate-900/80 dark:text-slate-400">
              <tr>
                <th className="px-2 py-2 text-left">Time</th>
                <th className="px-2 py-2 text-left">User</th>
                <th className="px-2 py-2 text-left">Event</th>
                <th className="px-2 py-2 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr
                  key={idx}
                  className="border-t border-slate-200 odd:bg-white dark:border-slate-800/60 dark:odd:bg-slate-950/40"
                >
                  <td className="px-2 py-1 text-slate-700 dark:text-slate-300">
                    {log.time}
                  </td>
                  <td className="px-2 py-1 text-sky-700 dark:text-sky-300">
                    {log.user}
                  </td>
                  <td className="px-2 py-1 text-slate-800 dark:text-slate-100">
                    {log.event}
                  </td>
                  <td className="px-2 py-1 max-w-[360px] truncate text-slate-700 dark:text-slate-300">
                    {log.detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[0.7rem] text-slate-500 dark:text-slate-500">
          Integration hint: call a Tauri command like{' '}
          <span className="font-mono text-sky-700 dark:text-sky-300">
            get_watchlist_activity(24h)
          </span>{' '}
          and pass the result into this modal as <code>logs</code>.
        </p>
      </motion.div>
    </motion.div>
  );
}
