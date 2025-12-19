// src/components/modals/WatchlistBlockedModal.jsx
import React from 'react';
import { motion } from 'framer-motion';

export default function WatchlistBlockedModal({
  open,
  onClose,
  events = [],
  timeLabel = 'Last 24 hours',
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
          <div>
            <h3 className="text-lg font-semibold text-(--orange400)">
              Watchlist Users · Blocked Operations
            </h3>
            <p className="text-[0.7rem] text-slate-400">
              Attempts by read-only users to delete, move, rename or copy
              protected files.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-slate-300 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto text-sm text-slate-200">
          <table className="w-full text-xs">
            <thead className="border-b border-slate-800/70 text-slate-400">
              <tr>
                <th className="py-1 text-left">Time</th>
                <th className="py-1 text-left">User</th>
                <th className="py-1 text-left">Operation</th>
                <th className="py-1 text-left">File / Path</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-800/40 text-slate-200"
                >
                  <td className="py-1 text-slate-300">{e.time}</td>
                  <td className="py-1 text-sky-300">{e.user}</td>
                  <td className="py-1 text-red-300">{e.op}</td>
                  <td className="py-1 text-slate-400">{e.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-3 text-[0.7rem] text-slate-400">
            Tauri: query a policy log via{' '}
            <span className="font-mono text-(--orange400)">
              get_watchlist_blocked_attempts({`{ window: "24h" | "48h" | "1w" | "1m" | "1y" }`})
            </span>
            . Use a dropdown in the Dashboard to change{' '}
            <span className="font-mono">window</span> for 2 days, week, month,
            year.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
