'use client'

import { useState, useEffect, useCallback } from 'react'
import { Timer, X } from 'lucide-react'
import { formatTime } from '../lib/utils'

const DURATIONS = [30, 60, 90, 120]

export default function RestTimer({ isActive, onDismiss }) {
  const [duration, setDuration] = useState(60)
  const [remaining, setRemaining] = useState(60)
  const [running, setRunning] = useState(false)

  // Start timer when activated
  useEffect(() => {
    if (isActive && !running) {
      setRemaining(duration)
      setRunning(true)
    }
  }, [isActive, duration, running])

  // Countdown
  useEffect(() => {
    if (!running || remaining <= 0) {
      if (remaining <= 0 && running) {
        setRunning(false)
        onDismiss?.()
      }
      return
    }

    const timer = setInterval(() => {
      setRemaining(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [running, remaining, onDismiss])

  const handleDismiss = useCallback(() => {
    setRunning(false)
    setRemaining(0)
    onDismiss?.()
  }, [onDismiss])

  const handleDurationChange = useCallback((newDuration) => {
    setDuration(newDuration)
    setRemaining(newDuration)
  }, [])

  if (!running && !isActive) return null
  if (!running) return null

  const progress = remaining / duration

  return (
    <div
      className="fixed bottom-[80px] left-1/2 -translate-x-1/2 z-[90] animate-slide-up"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="bg-card border border-border rounded-2xl shadow-lg shadow-black/40 px-4 py-3 flex items-center gap-3 min-w-[280px]">
        {/* Timer Icon with pulse */}
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center animate-glow-pulse">
          <Timer className="w-5 h-5 text-accent" />
        </div>

        {/* Time display */}
        <div className="flex-1">
          <div className="text-lg font-semibold text-txt-primary font-mono">
            {formatTime(remaining)}
          </div>
          {/* Progress bar */}
          <div className="w-full h-1 bg-border rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-accent rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* Duration presets */}
        <div className="flex gap-1">
          {DURATIONS.map(d => (
            <button
              key={d}
              onClick={() => handleDurationChange(d)}
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md transition-colors
                ${d === duration
                  ? 'bg-accent text-root'
                  : 'text-txt-muted hover:text-txt-secondary'
                }`}
            >
              {d}s
            </button>
          ))}
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="w-7 h-7 rounded-full bg-card-secondary flex items-center justify-center text-txt-muted hover:text-txt-primary transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
