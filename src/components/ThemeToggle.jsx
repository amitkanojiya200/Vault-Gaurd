// src/components/ThemeToggle.jsx
import React, { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

const STORAGE_KEY = 'coastvault_theme' // 'light' | 'dark' | 'system'

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'system'
    } catch {
      return 'system'
    }
  })

  // Apply theme to document element
  useEffect(() => {
    const el = document.documentElement
    if (theme === 'dark') {
      el.setAttribute('data-theme', 'dark')
    } else if (theme === 'light') {
      el.removeAttribute('data-theme') // use default (light)
    } else {
      // system: clear explicit attr; let CSS media query handle appearance if used
      el.removeAttribute('data-theme')
      // but we can also sync to system preference at runtime:
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) el.setAttribute('data-theme', 'dark')
    }
    try { localStorage.setItem(STORAGE_KEY, theme) } catch {}
  }, [theme])

  // Optional: listen for system theme changes when on 'system'
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      if (e.matches) document.documentElement.setAttribute('data-theme', 'dark')
      else document.documentElement.removeAttribute('data-theme')
    }
    mq.addEventListener ? mq.addEventListener('change', handler) : mq.addListener(handler)
    return () => (mq.removeEventListener ? mq.removeEventListener('change', handler) : mq.removeListener(handler))
  }, [theme])

  return (
    <div className="flex items-center gap-2">
      <button
        title="Light theme"
        onClick={() => setTheme('light')}
        className={`px-2 py-1 rounded ${theme === 'light' ? 'ring-2 ring-white/12' : 'hover:bg-white/4'}`}
        aria-pressed={theme === 'light'}
      >
        <Sun size={16} />
      </button>

      <button
        title="System theme"
        onClick={() => setTheme('system')}
        className={`px-2 py-1 rounded ${theme === 'system' ? 'ring-2 ring-white/12' : 'hover:bg-white/4'}`}
        aria-pressed={theme === 'system'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/></svg>
      </button>

      <button
        title="Dark theme"
        onClick={() => setTheme('dark')}
        className={`px-2 py-1 rounded ${theme === 'dark' ? 'ring-2 ring-white/12' : 'hover:bg-white/4'}`}
        aria-pressed={theme === 'dark'}
      >
        <Moon size={16} />
      </button>
    </div>
  )
}
