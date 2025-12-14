// src/components/charts/StatsChart.jsx
import React, { useEffect, useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { Line, Pie, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement)

/* -------------------------
   Helpers: read theme + color utils
   ------------------------- */
function readThemeColors() {
  const s = getComputedStyle(document.documentElement)
  const navy = (s.getPropertyValue('--navy') || '#0A2342').trim()
  const coastal = (s.getPropertyValue('--coastal') || '#0F4C81').trim()
  const ocean = (s.getPropertyValue('--ocean') || '#1C7EEB').trim()
  const sky = (s.getPropertyValue('--sky') || '#6DBBFF').trim()
  const softWhite = (s.getPropertyValue('--soft-white') || '#F4F8FB').trim()
  const muted = (s.getPropertyValue('--navy-muted') || 'rgba(33,64,103,0.7)').trim()
  const gradientFrom = (s.getPropertyValue('--gradient-from') || navy).trim()
  const gradientTo = (s.getPropertyValue('--gradient-to') || coastal).trim()

  return { navy, coastal, ocean, sky, softWhite, muted, gradientFrom, gradientTo }
}

function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(28,126,235,${alpha})`
  const h = hex.replace('#', '').trim()
  if (h.length !== 6) return `rgba(28,126,235,${alpha})`
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** Slightly lighten/darken a hex color by percent (-100..100) */
function shadeHex(hex, percent) {
  try {
    const h = hex.replace('#', '')
    const num = parseInt(h, 16)
    let r = (num >> 16) + Math.round(2.55 * percent)
    let g = ((num >> 8) & 0x00FF) + Math.round(2.55 * percent)
    let b = (num & 0x0000FF) + Math.round(2.55 * percent)
    r = Math.max(0, Math.min(255, r))
    g = Math.max(0, Math.min(255, g))
    b = Math.max(0, Math.min(255, b))
    return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0')
  } catch (e) {
    return hex
  }
}

/** Build a palette array from theme colors */
function buildPalette(theme) {
  const base = [theme.ocean, theme.coastal, theme.sky, theme.navy]
  // produce multiple shades from each base color
  const palette = []
  base.forEach((c, i) => {
    palette.push(c)
    palette.push(shadeHex(c, 12))
    palette.push(shadeHex(c, -12))
  })
  // ensure uniqueness
  return Array.from(new Set(palette))
}

/* -------------------------
   Chart components
   ------------------------- */

/** LineChart (multi-dataset friendly) */
export function LineChart({ data }) {
  const [theme, setTheme] = useState(() => readThemeColors())

  useEffect(() => {
    const mo = new MutationObserver(() => setTheme(readThemeColors()))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [])

  const palette = useMemo(() => buildPalette(theme), [theme])

  const chartData = useMemo(() => {
    // If data.datasets provided, assign colors per dataset, otherwise wrap single dataset
    const datasets = (data.datasets || [{ ...data }]).map((ds, i) => {
      const color = palette[i % palette.length] || theme.ocean
      const fillColor = hexToRgba(color, 0.12)
      return {
        ...ds,
        borderColor: color,
        backgroundColor: ds.fill === false ? 'transparent' : fillColor,
        pointBackgroundColor: color,
        pointBorderColor: hexToRgba(theme.gradientFrom, 0.12)
      }
    })
    return { ...data, datasets }
  }, [data, palette, theme])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: data.datasets && data.datasets.length > 1 },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: {
        ticks: { color: theme.navy },
        grid: { color: hexToRgba(theme.navy, 0.06) }
      },
      y: {
        ticks: { color: theme.navy },
        grid: { color: hexToRgba(theme.navy, 0.06) }
      }
    }
  }), [theme, data.datasets])

  return (
    <div style={{ height: 320 }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

/** BarChart (vertical bars, multi dataset) */
export function BarChart({ data }) {
  const [theme, setTheme] = useState(() => readThemeColors())
  useEffect(() => {
    const mo = new MutationObserver(() => setTheme(readThemeColors()))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [])

  const palette = useMemo(() => buildPalette(theme), [theme])

  const chartData = useMemo(() => {
    const datasets = (data.datasets || []).map((ds, i) => {
      const color = palette[i % palette.length] || theme.coastal
      return {
        ...ds,
        backgroundColor: hexToRgba(color, 0.9),
        borderColor: hexToRgba(shadeHex(color, -8), 1),
        borderWidth: 1
      }
    })
    return { ...data, datasets }
  }, [data, palette, theme])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: data.datasets && data.datasets.length > 1 },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { ticks: { color: theme.navy }, grid: { color: hexToRgba(theme.navy, 0.04) } },
      y: { ticks: { color: theme.navy }, grid: { color: hexToRgba(theme.navy, 0.04) } }
    }
  }), [theme, data.datasets])

  return (
    <div style={{ height: 320 }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}

/** PieChart (and small donut variant) */
export function PieChart({ data, donut = false }) {
  const [theme, setTheme] = useState(() => readThemeColors())
  useEffect(() => {
    const mo = new MutationObserver(() => setTheme(readThemeColors()))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [])

  const palette = useMemo(() => buildPalette(theme), [theme])

  const chartData = useMemo(() => {
    const copy = JSON.parse(JSON.stringify(data))
    if (copy.datasets && copy.datasets[0]) {
      // create background colors if not present
      if (!copy.datasets[0].backgroundColor || copy.datasets[0].backgroundColor.length < (copy.labels || []).length) {
        copy.datasets[0].backgroundColor = (copy.labels || []).map((_, i) => hexToRgba(palette[i % palette.length], 0.88))
      }
      copy.datasets[0].borderColor = (copy.datasets[0].backgroundColor || []).map(c => hexToRgba(c.replace(/rgba\(|\)/g, ''), 1) )
      copy.datasets[0].hoverOffset = 6
    }
    return copy
  }, [data, palette])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } },
    cutout: donut ? '50%' : 0
  }

  return (
    <div style={{ height: 320 }}>
      {donut ? <Doughnut data={chartData} options={options} /> : <Pie data={chartData} options={options} />}
    </div>
  )
}

/* -------------------------
   Exports (for easy imports)
   ------------------------- */
export default {
  LineChart,
  BarChart,
  PieChart
}
