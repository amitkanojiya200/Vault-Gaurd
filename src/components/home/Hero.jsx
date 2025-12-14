import React from 'react'
import { motion } from 'framer-motion'

export default function Hero({ onEnter }) {
  return (
    <section
      className={`
        relative overflow-hidden
        py-12
        bg-gradient-to-b
        from-[var(--gradient-from)] to-[var(--gradient-to)]
        dark:from-[var(--gradient-from)] dark:to-[var(--gradient-to)]
      `}
    >
      {/* decorative wave */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <svg className="w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="waveGrad" x1="0" x2="1">
              <stop offset="0%" stopColor="var(--coastal)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--ocean)" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path fill="url(#waveGrad)" d="M0,256L80,234.7C160,213,320,171,480,160C640,149,800,171,960,176C1120,181,1280,171,1360,165.3L1440,160L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-(--navy)">
              COAST VAULT
            </h1>

            <p className="mt-3 text-[var(--soft-white)] max-w-xl">
              Secure offline access to files, folders and documents across local drives — fast, reliable, and mission-ready for Coast Guard operations.
            </p>

            <div className="mt-6 flex gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={onEnter}
                className="px-6 py-3 rounded-lg font-medium bg-[var(--coastal)] text-[var(--soft-white)] hover:brightness-105 transition"
              >
                Enter Vault
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 rounded-lg font-medium bg-[rgba(255,255,255,0.12)] text-[var(--soft-white)] border border-[rgba(255,255,255,0.12)] hover:opacity-90 transition"
                onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>

          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
            {/* Example info panel */}
            <div className="p-6 rounded-xl bg-[var(--bg-light-soft)] dark:bg-[var(--bg-dark-soft)] border border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.04)]">
              <h4 className="text-lg font-semibold text-[var(--navy)] dark:text-[var(--soft-white)]">Operational Highlights</h4>
              <ul className="mt-3 space-y-2 text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)]">
                <li>• Fast local indexing of connected drives</li>
                <li>• Full-text search inside PDFs & Office docs</li>
                <li>• Secure, offline operation (air-gapped)</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
