import React, { useState } from 'react'

export default function SearchPanel({ onSearch }) {
  const [q, setQ] = useState('')
  return (
    <div className="rounded-lg p-3 bg-white/5 flex items-center gap-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch && onSearch(q)}
        placeholder="Search files, folders or documents..."
        className="flex-1 bg-transparent outline-none p-2"
        aria-label="Search files"
      />
      <button onClick={() => onSearch && onSearch(q)} className="px-4 py-2 rounded bg-coastal/80 hover:scale-105">Search</button>
    </div>
  )
}
