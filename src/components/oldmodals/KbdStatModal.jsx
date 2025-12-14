import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KbdStatModal({
  open,
  onClose,
  statType,
  drivers = [],
  driveUsage = [],
}) {
  const { title, body } = useMemo(() => {
    if (!statType) return { title: '', body: null };

    // 1) Drivers Indexing
    if (statType === 'drivers') {
      return {
        title: 'Drivers Indexing Overview',
        body: (
          <div>
            <p className="mb-3 text-slate-700 dark:text-slate-300">
              Total indexed drivers:{' '}
              <span className="font-semibold text-sky-700 dark:text-sky-300">
                {drivers.length}
              </span>
            </p>
            <ul className="mb-3 space-y-1 text-xs">
              {drivers.map((drive) => (
                <li
                  key={drive}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1 border border-slate-200 dark:bg-slate-950/60 dark:border-slate-800"
                >
                  <span className="text-slate-800 dark:text-slate-200">
                    {drive}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Status:{' '}
                    <span className="text-emerald-600 dark:text-emerald-300">
                      Indexed
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Future (Tauri): fetch actual driver list & index status from
              PRABAL backend.
            </p>
          </div>
        ),
      };
    }

    // 2) Storage info (used / remaining)
    if (statType === 'storage') {
      return {
        title: 'Storage Usage Overview',
        body: (
          <div>
            <p className="mb-3 text-slate-700 dark:text-slate-300">
              Approximate used vs free per storage device.
            </p>
            <table className="mb-3 w-full text-xs text-slate-800 dark:text-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-600 dark:bg-slate-900/80 dark:text-slate-400">
                  <th className="py-1 text-left">Driver</th>
                  <th className="py-1 text-right">Used %</th>
                  <th className="py-1 text-right">Free %</th>
                </tr>
              </thead>
              <tbody>
                {driveUsage.map((d) => {
                  const free = Math.max(0, 100 - d.used);
                  return (
                    <tr
                      key={d.drive}
                      className="border-t border-slate-200 odd:bg-white dark:border-slate-800/60 dark:odd:bg-slate-950/40"
                    >
                      <td className="py-1">{d.drive}</td>
                      <td className="py-1 text-right text-orange-600 dark:text-orange-300">
                        {d.used}%
                      </td>
                      <td className="py-1 text-right text-emerald-600 dark:text-emerald-300">
                        {free}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Future (Tauri): use real capacity (bytes) from filesystem + thresholds
              for alerts.
            </p>
          </div>
        ),
      };
    }

    // 3) Active users & admins
    if (statType === 'users') {
      // mock names for now; later replace with Tauri data
      const admins = ['Admin-01', 'Admin-02', 'Admin-03'];
      const users = ['User-07', 'User-09', 'User-12', 'User-15', 'User-21'];

      return {
        title: 'Active Users & Admins',
        body: (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold text-sky-700 dark:text-sky-300">
                Admins
              </p>
              <ul className="space-y-1 text-xs">
                {admins.map((name) => (
                  <li
                    key={name}
                    className="rounded-lg bg-slate-50 px-2 py-1 text-slate-800 border border-slate-200 dark:bg-slate-950/60 dark:text-slate-200 dark:border-slate-800"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-sky-700 dark:text-sky-300">
                Active Users
              </p>
              <ul className="space-y-1 text-xs">
                {users.map((name) => (
                  <li
                    key={name}
                    className="rounded-lg bg-slate-50 px-2 py-1 text-slate-800 border border-slate-200 dark:bg-slate-950/60 dark:text-slate-200 dark:border-slate-800"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2 text-xs text-slate-500 dark:text-slate-500">
              Future (Tauri): replace with real users, roles, and sessions from
              local auth DB.
            </div>
          </div>
        ),
      };
    }

    // 4) Indexed files breakdown by type
    if (statType === 'indexedFiles') {
      const types = [
        { label: 'PDFs', count: 420000 },
        { label: 'Images', count: 350000 },
        { label: 'DOCX', count: 210000 },
        { label: 'XLSX', count: 90000 },
        { label: 'Logs / TXT', count: 130000 },
      ];
      const total = types.reduce((sum, t) => sum + t.count, 0);

      return {
        title: 'Indexed Files Overview',
        body: (
          <div>
            <p className="mb-2 text-slate-700 dark:text-slate-300">
              Total indexed files:{' '}
              <span className="font-semibold text-sky-700 dark:text-sky-300">
                {total.toLocaleString()}
              </span>
            </p>
            <ul className="mb-3 space-y-1 text-xs">
              {types.map((t) => (
                <li
                  key={t.label}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1 border border-slate-200 dark:bg-slate-950/60 dark:border-slate-800"
                >
                  <span className="text-slate-800 dark:text-slate-200">
                    {t.label}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {t.count.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Future (Tauri): compute breakdown by extension / MIME from your
              index DB.
            </p>
          </div>
        ),
      };
    }

    // 5) Indexed storage per driver
    if (statType === 'indexedStorage') {
      return {
        title: 'Indexed Storage by Driver',
        body: (
          <div>
            <p className="mb-3 text-slate-700 dark:text-slate-300">
              Files indexed vs. approximate usage per driver.
            </p>
            <table className="mb-3 w-full text-xs text-slate-800 dark:text-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-600 dark:bg-slate-900/80 dark:text-slate-400">
                  <th className="py-1 text-left">Driver</th>
                  <th className="py-1 text-right">Indexed Files</th>
                  <th className="py-1 text-right">Used %</th>
                  <th className="py-1 text-right">Free %</th>
                </tr>
              </thead>
              <tbody>
                {driveUsage.map((d, idx) => {
                  const free = Math.max(0, 100 - d.used);
                  const indexedFiles = (idx + 1) * 50000; // mock
                  return (
                    <tr
                      key={d.drive}
                      className="border-t border-slate-200 odd:bg-white dark:border-slate-800/60 dark:odd:bg-slate-950/40"
                    >
                      <td className="py-1">{d.drive}</td>
                      <td className="py-1 text-right text-sky-700 dark:text-sky-300">
                        {indexedFiles.toLocaleString()}
                      </td>
                      <td className="py-1 text-right text-orange-600 dark:text-orange-300">
                        {d.used}%
                      </td>
                      <td className="py-1 text-right text-emerald-600 dark:text-emerald-300">
                        {free}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Future (Tauri): drive this from index DB (group by drive/path).
            </p>
          </div>
        ),
      };
    }

    return { title: '', body: null };
  }, [statType, drivers, driveUsage]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ y: 10, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 w-[min(900px,95%)] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/95 dark:shadow-black/40"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-sky-300">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="rounded px-2 py-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-4 text-sm text-slate-800 dark:text-slate-200">
              {body}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
