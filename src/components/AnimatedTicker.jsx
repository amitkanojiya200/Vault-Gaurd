// src/components/AnimatedTicker.jsx
import React from 'react'

export default function AnimatedTicker() {
  return (
    <div className="w-full bg-(--card-bg) dark:bg-(--card-bg)">
      <div className="max-w-7xl mx-auto px-4 py-2 overflow-hidden">
        <div className="whitespace-nowrap animate-marquee text-sm text-(--soft-white)/90">
          Coast Guard • Maritime Security • Operational Readiness • Offline • COAST VAULT — &nbsp;
        </div>
      </div>
    </div>
  )
}
