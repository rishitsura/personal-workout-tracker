'use client'

import { useMemo } from 'react'
import { getDayColor } from '../lib/workoutData'

// ========================================
// VOLUME BAR CHART
// ========================================

export function VolumeBarChart({ sessions }) {
  const chartData = useMemo(() => {
    if (!sessions || sessions.length === 0) return []
    
    // Take last 14 completed sessions, sorted oldest to newest
    const recent = [...sessions]
      .filter(s => s.completed)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      
    return recent.map(s => {
      let vol = 0
      s.exercises?.forEach(ex => {
        ex.sets?.forEach(set => {
          if (set.done) vol += (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)
        })
      })
      return {
        date: s.date,
        shortDate: s.date.substring(5, 10).replace('-', '/'),
        volume: vol,
        color: getDayColor(s.dayKey)
      }
    })
  }, [sessions])

  if (chartData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-txt-muted bg-card-secondary/50 rounded-xl border border-border border-dashed">
        Not enough data yet
      </div>
    )
  }

  const maxVol = Math.max(...chartData.map(d => d.volume), 100) // min 100 to avoid div by zero/weird scales

  return (
    <div className="h-52 w-full pt-4 pb-6 relative flex items-end gap-1.5 overflow-x-auto no-scrollbar">
      {chartData.map((d, i) => {
        const heightPct = (d.volume / maxVol) * 100
        return (
          <div key={`${d.date}-${i}`} className="flex flex-col items-center flex-1 min-w-[24px] gap-2 group relative">
            
            {/* Tooltip on hover */}
            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border shadow-lg rounded-md px-2 py-1 text-[10px] whitespace-nowrap z-10 pointer-events-none">
              <span className="text-txt-primary font-mono">{d.volume.toLocaleString()}</span> kg
            </div>

            {/* Bar */}
            <div className="w-full h-32 flex items-end bg-card-secondary rounded-sm overflow-hidden">
              <div 
                className="w-full rounded-sm transition-all duration-700 ease-out animate-slide-up"
                style={{ height: `${heightPct}%`, backgroundColor: d.color }}
              />
            </div>

            {/* Label */}
            <span className="text-[9px] text-txt-muted font-mono transform -rotate-45 origin-top-left translate-y-1">
              {d.shortDate}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ========================================
// DAY SPLIT HORIZONTAL BARS
// ========================================

export function DaySplitBars({ sessions }) {
  const splitData = useMemo(() => {
    if (!sessions || sessions.length === 0) return []
    
    const counts = {}
    let total = 0
    sessions.forEach(s => {
      if (s.completed) {
        counts[s.dayKey] = (counts[s.dayKey] || 0) + 1
        total++
      }
    })

    if (total === 0) return []

    const data = Object.keys(counts).map(key => ({
      key,
      count: counts[key],
      pct: (counts[key] / total) * 100,
      color: getDayColor(key),
      label: `Day ${key.replace('day', '')}`
    })).sort((a, b) => b.count - a.count)

    return data
  }, [sessions])

  if (splitData.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-sm text-txt-muted bg-card-secondary/50 rounded-xl border border-border border-dashed">
        No sessions logged
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {splitData.map((d, i) => (
        <div key={d.key} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-txt-secondary font-medium">{d.label}</span>
            <span className="text-txt-primary">{d.count} <span className="text-txt-muted font-mono">({Math.round(d.pct)}%)</span></span>
          </div>
          <div className="w-full h-2 bg-card-secondary rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out animate-slide-up"
              style={{ width: `${d.pct}%`, backgroundColor: d.color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ========================================
// SPARKLINE (for body weight)
// ========================================

export function SparkLine({ data, color = '#f97316' }) {
  // data: array of numbers
  if (!data || data.length < 2) {
    return (
      <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
        <line x1="0" y1="10" x2="100" y2="10" stroke="#2a2a2a" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
    )
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min === 0 ? 1 : max - min
  
  // Map points to SVG coordinates (0-100 x, 2-18 y to leave padding for stroke)
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 18 - (((val - min) / range) * 16)
    return `${x},${y}`
  }).join(' ')

  return (
    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
      <polyline 
        fill="none" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        points={points}
        className="animate-fade-in"
      />
      {/* Optional fade under line */}
      <polygon
        fill={`url(#gradient-${color.replace('#', '')})`}
        points={`${points} 100,20 0,20`}
        className="animate-fade-in"
        style={{ animationDelay: '200ms' }}
      />
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}
