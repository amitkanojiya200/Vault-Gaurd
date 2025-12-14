// ../components/modals/DriversUsageModal.jsx
import React from 'react';
import { motion } from 'framer-motion';

export default function DriversUsageModal({
  open,
  onClose,
  driveUsage = [],
  indexedFilesByDrive = [],
}) {
  if (!open) return null;

  // quick helper to match indexed files with usage
  const combined = driveUsage.map((d) => {
    const match = indexedFilesByDrive.find((x) => x.drive === d.drive);
    return {
      drive: d.drive,
      used: d.used,
      indexedFiles: match ? match.files : 0,
    };
  });

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
        className="relative z-10 w-[min(720px,95%)] max-h-[80vh] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/95 dark:shadow-black/40"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-sky-300">
            Drivers Usage · Indexed View
          </h3>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Close
          </button>
        </div>

        <p className="mb-2 text-xs text-slate-600 dark:text-slate-400">
          Per-driver view showing storage usage (%) and how many files are
          currently indexed on each storage node.
        </p>

        <div className="max-h-[60vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50/90 dark:border-slate-800/80 dark:bg-slate-950/70">
          <table className="w-full text-xs text-slate-800 dark:text-slate-200">
            <thead className="bg-slate-100 text-slate-600 dark:bg-slate-900/80 dark:text-slate-400">
              <tr>
                <th className="px-2 py-2 text-left">Driver</th>
                <th className="px-2 py-2 text-left">Used %</th>
                <th className="px-2 py-2 text-left">Indexed Files</th>
                <th className="px-2 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {combined.map((row) => (
                <tr
                  key={row.drive}
                  className="border-t border-slate-200 odd:bg-white dark:border-slate-800/60 dark:odd:bg-slate-950/40"
                >
                  <td className="px-2 py-1 text-sky-700 dark:text-sky-300">
                    {row.drive}
                  </td>
                  <td className="px-2 py-1 text-slate-800 dark:text-slate-200">
                    {row.used}
                    <span className="text-slate-500 dark:text-slate-500">%</span>
                  </td>
                  <td className="px-2 py-1 text-slate-800 dark:text-slate-200">
                    {row.indexedFiles.toLocaleString()}
                  </td>
                  <td className="px-2 py-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.65rem] ${
                        row.used > 80
                          ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300'
                          : row.used > 60
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                      }`}
                    >
                      {row.used > 80
                        ? 'CRITICAL'
                        : row.used > 60
                        ? 'HIGH'
                        : 'NORMAL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[0.7rem] text-slate-500 dark:text-slate-500">
          Integration hint: use a Tauri command like{' '}
          <span className="font-mono text-sky-700 dark:text-sky-300">
            get_driver_usage_with_index()
          </span>{' '}
          to populate <code>driveUsage</code> and{' '}
          <code>indexedFilesByDrive</code>.
        </p>
      </motion.div>
    </motion.div>
  );
}
