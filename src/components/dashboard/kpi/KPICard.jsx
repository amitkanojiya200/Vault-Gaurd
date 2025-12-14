// src/components/kpi/KPICard.jsx
import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown } from 'lucide-react'

/**
 * KPICard (updated)
 * - tooltip on delta badge (hover)
 * - sparkline color reacts to delta sign
 * - clickable (onClick) remains
 */
const Sparkline = ({ data = [], width = 86, height = 24, strokeWidth = 1.6, colorClass = 'text-[var(--coastal)]' }) => {
  if (!data || data.length === 0) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = Math.max(1, max - min)
  const step = width / Math.max(1, data.length - 1)

  const points = data.map((v, i) => {
    const x = i * step
    const y = height - ((v - min) / range) * height
    return [x, y]
  })

  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ')
  const areaD = [
    `M ${points[0][0].toFixed(2)} ${height.toFixed(2)}`,
    ...points.map((p) => `L ${p[0].toFixed(2)} ${p[1].toFixed(2)}`),
    `L ${points[points.length - 1][0].toFixed(2)} ${height.toFixed(2)}`,
    'Z'
  ].join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={`inline-block align-middle ${colorClass}`}>
      <defs>
        <linearGradient id="kpi-gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(60,130,246,0.12)" />
          <stop offset="100%" stopColor="rgba(60,130,246,0.02)" />
        </linearGradient>
      </defs>

      <path d={areaD} fill="url(#kpi-gradient)" />

      <path d={d} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className="opacity-95" />
    </svg>
  )
}

const KPICard = React.forwardRef(function KPICard(
  { title, value, hint, icon, sparkline, delta, onClick, tooltipDelta = 'Change vs previous period', className = '', ...rest },
  ref
) {
  const clickable = typeof onClick === 'function'

  const handleKey = (e) => {
    if (!clickable) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(e)
    }
  }

  const deltaPositive = typeof delta === 'number' && delta > 0
  const deltaNegative = typeof delta === 'number' && delta < 0

  const deltaClasses = deltaPositive
    ? 'text-green-500 dark:text-green-300 bg-green-50 dark:bg-[rgba(16,96,48,0.06)]'
    : deltaNegative
    ? 'text-red-500 dark:text-red-300 bg-red-50 dark:bg-[rgba(96,16,16,0.05)]'
    : 'text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)] bg-[var(--bg-light-soft)] dark:bg-[var(--bg-dark-soft)]'

  // sparkline color class based on delta sign
  const sparkClass = deltaPositive ? 'text-green-400' : deltaNegative ? 'text-red-400' : 'text-[var(--coastal)] dark:text-[var(--ocean)]'

  return (
    <motion.div
      whileHover={clickable ? { y: -4 } : { y: -2 }}
      onClick={onClick}
      onKeyDown={handleKey}
      role={clickable ? 'button' : 'group'}
      tabIndex={clickable ? 0 : -1}
      aria-pressed={clickable ? false : undefined}
      ref={ref}
      className={`relative p-4 rounded-lg ${className} ${clickable ? 'cursor-pointer' : ''} bg-[var(--bg-light-soft)] dark:bg-[var(--bg-dark-soft)] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)] focus:outline-none focus:ring-2 focus:ring-[var(--coastal)]`}
      {...rest}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)] truncate">{title}</div>
              <div className="mt-1 text-2xl font-bold text-[var(--navy)] dark:text-[var(--soft-white)] truncate">{value}</div>
              {hint && <div className="text-xs mt-1 text-[var(--navy-muted)] dark:text-[var(--soft-white-muted)] truncate">{hint}</div>}
            </div>

            {typeof delta === 'number' && (
              <div className="relative group">
                <div className={`ml-2 px-2 py-1 flex items-center gap-1 rounded-full text-xs font-medium ${deltaClasses}`}>
                  {deltaPositive && <ArrowUp size={14} />}
                  {deltaNegative && <ArrowDown size={14} />}
                  <span>{Math.abs(delta)}%</span>
                </div>

                {/* tooltip for delta badge */}
                <div
                  role="tooltip"
                  className="absolute right-0 -top-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity text-xs whitespace-nowrap px-2 py-1 rounded bg-[var(--navy-muted)] text-white shadow-sm"
                >
                  {tooltipDelta}
                </div>
              </div>
            )}
          </div>

          {/* sparkline below value */}
          {Array.isArray(sparkline) && sparkline.length > 0 && (
            <div className="mt-3">
              <Sparkline data={sparkline} colorClass={sparkClass} />
            </div>
          )}
        </div>

        {icon && (
          <div className="ml-3 w-12 h-12 rounded-lg flex items-center justify-center bg-[var(--coastal)] dark:bg-[var(--ocean)] text-white shrink-0">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  )
})

export default KPICard
