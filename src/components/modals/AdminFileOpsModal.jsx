// src/components/modals/AdminFileOpsModal.jsx
import React from 'react';
import { motion } from 'framer-motion';

export default function AdminFileOpsModal({
  open,
  onClose,
  ops = [],
  timeLabel = 'Last 24 hours',
  onOpenPath, // optional: (path) => void (Tauri: open in explorer)
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
              Admin File Operations · {timeLabel}
            </h3>
            <p className="text-[0.7rem] text-slate-400">
              Delete, copy, move, rename and open actions performed by admins.
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
                <th className="py-1 text-left">Admin</th>
                <th className="py-1 text-left">Operation</th>
                <th className="py-1 text-left">Source Path</th>
                <th className="py-1 text-left">Destination</th>
                <th className="py-1 text-left">Status</th>
                <th className="py-1 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {ops.map((op, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-800/40 text-slate-200"
                >
                  <td className="py-1 text-slate-300">{op.time}</td>
                  <td className="py-1 text-sky-300">{op.admin}</td>
                  <td className="py-1 text-slate-100">{op.op}</td>
                  <td className="py-1 max-w-xs truncate text-slate-200">
                    {op.srcPath}
                  </td>
                  <td className="py-1 max-w-xs truncate text-slate-400">
                    {op.destPath || '—'}
                  </td>
                  <td className="py-1 text-slate-400">{op.status}</td>
                  <td className="py-1">
                    {onOpenPath && (
                      <button
                        type="button"
                        onClick={() => onOpenPath(op.srcPath)}
                        className="rounded px-2 py-0.5 text-[0.65rem] text-sky-300 hover:bg-slate-800/80"
                      >
                        Open location
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-3 text-[0.7rem] text-slate-400">
            Tauri: each row can trigger a command like{' '}
            <span className="font-mono text-sky-300">
              open_path_in_explorer({`{ path: srcPath }`})
            </span>
            . Use a parameter{' '}
            <span className="font-mono">window: "24h" | "48h" | "1w" | "1m"</span>{' '}
            in <span className="font-mono">get_admin_file_operations()</span> to
            support 2 days, week, month, year ranges.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
