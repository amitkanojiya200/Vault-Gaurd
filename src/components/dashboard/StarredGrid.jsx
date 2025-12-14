// src/components/StarredGrid.jsx
import React from 'react'
import { motion } from 'framer-motion'

export default function StarredGrid({ items = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((it) => (
        <motion.div
          key={it.id}
          whileHover={{ y: -4 }}
          className="p-4 rounded-lg bg-[var(--bg-light-soft)] dark:bg-[var(--bg-dark-soft)] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--navy)] dark:text-[var(--soft-white)]">{it.name}</div>
              <div className="text-xs text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">{it.type} • {it.date}</div>
            </div>
            <div className="text-sm text-[var(--coastal)] dark:text-[var(--ocean)]">★</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
