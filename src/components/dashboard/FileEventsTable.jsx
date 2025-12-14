// a simple tabular events view; for real datasets, wire this to react-window or virtualization
import React, { useMemo } from 'react'

export default function FileEventsTable({ events = [] }) {
  const rows = useMemo(() => events.slice(0, 500), [events]) // naive limit; virtualize for >5000
  return (
    <div className="overflow-auto border rounded bg-[var(--bg-light-soft)] dark:bg-[var(--bg-dark-soft)]">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="px-3 py-2 text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">Time</th>
            <th className="px-3 py-2 text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">Event</th>
            <th className="px-3 py-2 text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">Path</th>
            <th className="px-3 py-2 text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">User</th>
            <th className="px-3 py-2 text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-[rgba(0,0,0,0.03)] dark:border-[rgba(255,255,255,0.02)] hover:bg-[var(--bg-light-alt)] dark:hover:bg-[var(--bg-dark-alt)]">
              <td className="px-3 py-2 align-top">{new Date(r.ts).toLocaleString()}</td>
              <td className="px-3 py-2 align-top font-medium text-[var(--navy)] dark:text-[var(--soft-white)]">{r.type}</td>
              <td className="px-3 py-2 align-top break-all text-xs text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">{r.path}</td>
              <td className="px-3 py-2 align-top text-xs">{r.user || 'system'}</td>
              <td className="px-3 py-2 align-top text-xs text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">{r.detail || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
