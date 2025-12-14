// src/components/modals/PortalActivityModal.jsx
import React from 'react';
import { motion } from 'framer-motion';

export default function PortalActivityModal({
  open,
  onClose,
  logs = [],
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
            <h3 className="text-lg font-semibold text-sky-300">
              Portal Activity · {timeLabel}
            </h3>
            <p className="text-[0.7rem] text-slate-400">
              Logins, logouts and page opens across PRABAL.
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
                <th className="py-1 text-left">Event</th>
                <th className="py-1 text-left">Action</th>
                {/* <th className="py-1 text-left">Client</th> */}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-800/40 text-slate-200"
                >
                  <td className="py-1 text-slate-300">{log.time}</td>
                  <td className="py-1 text-sky-300">{log.user}</td>
                  <td className="py-1">{log.event}</td>
                  <td className="py-1 text-slate-300">{log.page}</td>
                  {/* <td className="py-1 text-slate-400">{log.client}</td> */}
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-3 text-[0.7rem] text-slate-400">
            Tauri: connect to a local audit DB via{' '}
            <span className="font-mono text-sky-300">
              get_portal_audit_logs({`{ window: "24h" | "48h" | "1w" | "1m" | "1y" }`})
            </span>{' '}
            and pass the selected window from the Dashboard (24h, 2 days, week,
            month, year).
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
