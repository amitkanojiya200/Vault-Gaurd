// simple modal to show a filtered file list (client-only)
// usage: <FileListModal open={open} onClose={() => setOpen(false)} title="Indexed Files" items={items} />
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function FileListModal({ open, onClose, title = 'Files', items = [] }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            initial={{ y: 16, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 w-[min(100%,1000px)] max-h-[80vh] overflow-auto p-4 rounded-lg bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.04)]"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-[var(--navy)] dark:text-[var(--soft-white)]">{title}</h3>
              <button onClick={onClose} className="px-2 py-1 rounded bg-[var(--bg-light-soft)] dark:bg-[var(--bg-dark-soft)]">Close</button>
            </div>

            <div className="space-y-2">
              {items.length === 0 && <div className="text-sm text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">No files match this filter.</div>}

              {items.map((it, i) => (
                <div key={i} className="p-2 rounded hover:bg-[var(--bg-light-alt)] dark:hover:bg-[var(--bg-dark-alt)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-[var(--navy)] dark:text-[var(--soft-white)] truncate">{it.name}</div>
                    <div className="text-xs text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">{new Date(it.mtime).toLocaleString()}</div>
                  </div>
                  <div className="text-xs text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)] truncate">{it.path}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
