// simple vertical activity feed; accepts events = [{type, path, ts, user, detail}]
import React from 'react'
import { formatDistanceToNow } from 'date-fns'

export default function ActivityFeed({ events = [] }) {
  return (
    <div className="space-y-2 max-h-72 overflow-auto pr-2">
      {events.length === 0 && <div className="text-sm text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">No recent activity</div>}
      {events.map((e, i) => (
        <div key={i} className="flex items-start gap-3 p-2 rounded hover:bg-[var(--bg-light-alt)] dark:hover:bg-[var(--bg-dark-alt)]">
          <div className="w-2 h-8 rounded bg-[var(--coastal)] mt-1" />
          <div>
            <div className="text-sm font-medium text-[var(--navy)] dark:text-[var(--soft-white)]">{e.type} — <span className="font-normal text-xs text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">{e.user || 'system'}</span></div>
            <div className="text-xs text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">{e.detail || e.path}</div>
            <div className="text-xs text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)] mt-1">{formatDistanceToNow(new Date(e.ts), { addSuffix: true })}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
