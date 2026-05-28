'use client'
import { WORKOUT_PLANS, DAY_ORDER } from '../lib/workoutData'

export default function SkipDayModal({ currentDayKey, onSkip, onKeep, onClose }) {
  const currentPlan = WORKOUT_PLANS[currentDayKey]
  const nextIdx = (DAY_ORDER.indexOf(currentDayKey) + 1) % DAY_ORDER.length
  const nextKey = DAY_ORDER[nextIdx]
  const nextPlan = WORKOUT_PLANS[nextKey]

  return (
    <div
      className="overlay-backdrop"
      onClick={onClose}
      style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-slide-up"
        style={{
          background: '#0f0f0f',
          borderRadius: '24px 24px 0 0',
          padding: '24px 20px',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
          width: '100%',
          maxWidth: '480px',
          border: '1px solid #1a1a1a',
          borderBottom: 'none',
        }}
      >
        {/* Handle bar */}
        <div style={{ width: '36px', height: '4px', background: '#2a2a2a', borderRadius: '2px', margin: '0 auto 20px' }} />

        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '24px',
          letterSpacing: '0.04em',
          color: '#f0f0f0',
          marginBottom: '6px',
        }}>
          Skip This Workout?
        </div>
        <div style={{ fontSize: '13px', color: '#555', marginBottom: '24px', lineHeight: 1.5 }}>
          You can skip <span style={{ color: '#8a8a8a', fontWeight: 600 }}>{currentPlan.name}</span> and move to the next workout in your cycle.
        </div>

        {/* Next workout preview */}
        <div style={{
          padding: '16px',
          background: '#141414',
          borderRadius: '14px',
          border: '1px solid #1e1e1e',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: `${nextPlan.color}12`, border: `1px solid ${nextPlan.color}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={nextPlan.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '10px', color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
              Next Up
            </div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#f0f0f0' }}>
              {nextPlan.label} — {nextPlan.name}
            </div>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
              {nextPlan.exercises.length} exercises
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={onSkip}
            style={{
              width: '100%',
              height: '52px',
              borderRadius: '14px',
              border: '1px solid #2a2a2a',
              background: '#1a1a1a',
              color: '#f0f0f0',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              letterSpacing: '0.02em',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" />
            </svg>
            Skip to {nextPlan.shortName}
          </button>
          <button
            onClick={onKeep}
            style={{
              width: '100%',
              height: '52px',
              borderRadius: '14px',
              border: 'none',
              background: `linear-gradient(135deg, ${currentPlan.color}, ${currentPlan.color}cc)`,
              color: '#fff',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.02em',
              boxShadow: `0 4px 16px ${currentPlan.color}30`,
            }}
          >
            Do {currentPlan.shortName} Anyway
          </button>
        </div>
      </div>
    </div>
  )
}
