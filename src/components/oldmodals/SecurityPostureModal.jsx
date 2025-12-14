// ../components/modals/SecurityPostureModal.jsx
import React from 'react';
import { motion } from 'framer-motion';

export default function SecurityPostureModal({ open, onClose }) {
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
        className="relative z-10 w-[min(720px,95%)] max-h-[80vh] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/95 dark:shadow-black/40"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-sky-300">
            Policy & Security Posture
          </h3>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Close
          </button>
        </div>

        <p className="mb-3 text-xs text-slate-600 dark:text-slate-400">
          High-level overview of policy blocks, pending reviews, and removable
          media alerts inside the PRABAL environment.
        </p>

        <div className="grid gap-3 md:grid-cols-3 text-[0.8rem]">
          <div className="rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 dark:border-transparent dark:bg-slate-950/70">
            <p className="text-slate-500 text-[0.7rem]">
              Policy Blocks (24h)
            </p>
            <p className="text-red-600 text-xl font-semibold dark:text-red-300">
              12
            </p>
            <p className="mt-1 text-[0.65rem] text-slate-500 dark:text-slate-500">
              Files blocked due to RBAC or policy violations.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 dark:border-transparent dark:bg-slate-950/70">
            <p className="text-slate-500 text-[0.7rem]">
              Manual Reviews Pending
            </p>
            <p className="text-amber-600 text-xl font-semibold dark:text-amber-300">
              5
            </p>
            <p className="mt-1 text-[0.65rem] text-slate-500 dark:text-slate-500">
              Policy exceptions or unusual activity waiting on admin review.
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 px-3 py-2 border border-slate-200 dark:border-transparent dark:bg-slate-950/70">
            <p className="text-slate-500 text-[0.7rem]">
              USB / Media Alerts (24h)
            </p>
            <p className="text-sky-700 text-xl font-semibold dark:text-sky-300">
              3
            </p>
            <p className="mt-1 text-[0.65rem] text-slate-500 dark:text-slate-500">
              Suspicious large transfers or blocked removable devices.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-[0.75rem] text-slate-700 border border-slate-200 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
          <p className="mb-1 font-semibold text-sky-700 dark:text-sky-300">
            Next steps
          </p>
          <ul className="space-y-1 list-disc pl-4">
            <li>Drill down into blocked operations for false positives.</li>
            <li>Review open policy exceptions requested by field units.</li>
            <li>Correlate USB alerts with user sessions from Portal Activity.</li>
          </ul>
        </div>

        <p className="mt-3 text-[0.7rem] text-slate-500 dark:text-slate-500">
          Integration hint: expose a Tauri command like{' '}
          <span className="font-mono text-sky-700 dark:text-sky-300">
            get_security_posture_summary()
          </span>{' '}
          and hydrate this view with live counts.
        </p>
      </motion.div>
    </motion.div>
  );
}
