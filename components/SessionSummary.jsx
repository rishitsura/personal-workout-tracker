'use client'

import { useEffect } from 'react'
import { Trophy, Check, Zap, Flame } from 'lucide-react'
import { formatTime, formatVolume } from '../lib/utils'

export default function SessionSummary({ session, onDismiss }) {
  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!session) return null

  // Calculate stats
  let totalSets = 0
  let totalVolume = 0
  session.exercises?.forEach(ex => {
    ex.sets?.forEach(set => {
      if (set.done) {
        totalSets++
        totalVolume += (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)
      }
    })
  })

  // Calculate duration if we have times
  let durationStr = '—'
  if (session.startedAt && session.completedAt) {
    const start = session.startedAt.toDate ? session.startedAt.toDate() : new Date(session.startedAt)
    const end = session.completedAt.toDate ? session.completedAt.toDate() : new Date(session.completedAt)
    const diffMs = end - start
    if (!isNaN(diffMs) && diffMs > 0) {
      const mins = Math.floor(diffMs / 60000)
      durationStr = `${mins} min`
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-root/90 backdrop-blur-md animate-fade-in" />

      {/* Confetti (CSS-based) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: ['#f97316', '#22c55e', '#3b82f6', '#f59e0b'][Math.floor(Math.random() * 4)],
              left: `${Math.random() * 100}%`,
              top: '50%',
              animation: `confetti 1s ease-out forwards ${Math.random() * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div className="relative w-full max-w-sm bg-card rounded-3xl border border-border shadow-2xl shadow-accent/10 p-6 flex flex-col items-center text-center animate-scale-pop">
        
        {/* Trophy Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-amber-500 flex items-center justify-center mb-5 shadow-lg shadow-accent/20">
          <Trophy className="w-10 h-10 text-root" strokeWidth={2} />
        </div>

        {/* Header */}
        <h2 className="font-display text-4xl tracking-wider text-txt-primary mb-1">
          WORKOUT COMPLETE!
        </h2>
        <p className="text-sm text-txt-secondary mb-8">
          You crushed <span className="text-txt-primary font-medium">{session.dayName || 'your workout'}</span> today.
        </p>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3 mb-8">
          <div className="bg-card-secondary rounded-2xl p-4 flex flex-col items-center">
            <Zap className="w-5 h-5 text-amber-500 mb-1" />
            <span className="text-2xl font-display tracking-wider text-txt-primary mt-1">{totalSets}</span>
            <span className="text-[10px] text-txt-muted uppercase font-semibold">Total Sets</span>
          </div>
          
          <div className="bg-card-secondary rounded-2xl p-4 flex flex-col items-center">
            <Flame className="w-5 h-5 text-accent mb-1" />
            <span className="text-2xl font-display tracking-wider text-txt-primary mt-1">{formatVolume(totalVolume)}</span>
            <span className="text-[10px] text-txt-muted uppercase font-semibold">Volume (kg)</span>
          </div>
          
          <div className="col-span-2 bg-card-secondary rounded-2xl p-4 flex flex-col items-center">
            <span className="text-lg font-mono text-txt-primary">{durationStr}</span>
            <span className="text-[10px] text-txt-muted uppercase font-semibold">Duration</span>
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={onDismiss}
          className="w-full py-4 rounded-xl bg-accent text-root font-semibold text-base flex items-center justify-center gap-2 hover:bg-accent-light active:scale-[0.98] transition-all"
        >
          <Check className="w-5 h-5" strokeWidth={2.5} /> Done
        </button>
      </div>
    </div>
  )
}
