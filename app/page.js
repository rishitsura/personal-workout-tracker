'use client'
import { useState, useEffect, useCallback } from 'react'
import BottomNav from '../components/BottomNav'
import ExerciseCard from '../components/ExerciseCard'
import { WORKOUT_PLANS, DAY_ORDER } from '../lib/workoutData'
import {
  seedHistoricalData,
  getLogs,
  getLogForDate,
  saveLog,
  saveActiveSession,
  getActiveSession,
  getSuggestedDayKey,
} from '../lib/storage'

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
}

function buildSession(dayKey) {
  const plan = WORKOUT_PLANS[dayKey]
  return {
    date: getTodayStr(),
    dayKey,
    completed: false,
    exercises: plan.exercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      unit: ex.unit,
      sets: Array.from({ length: ex.defaultSets }, () => ({
        weight: '',
        reps: ex.defaultReps,
        done: false,
      })),
    })),
  }
}

function getPreviousSetsForExercise(exId, allLogs, currentDate) {
  const past = allLogs
    .filter((l) => l.date < currentDate && l.completed)
    .sort((a, b) => b.date.localeCompare(a.date))
  for (const log of past) {
    const found = log.exercises?.find((e) => e.id === exId)
    if (found) return found.sets
  }
  return null
}

export default function TodayPage() {
  const [session, setSession] = useState(null)
  const [allLogs, setAllLogs] = useState([])
  const [todayLog, setTodayLog] = useState(null)
  const [dayPickerOpen, setDayPickerOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    seedHistoricalData()
    const logs = getLogs()
    setAllLogs(logs)
    const today = getTodayStr()
    const existing = getLogForDate(today)
    if (existing && existing.completed) {
      setTodayLog(existing)
      setLoading(false)
      return
    }
    const active = getActiveSession()
    if (active && active.date === today) {
      setSession(active)
    } else {
      const suggestedKey = getSuggestedDayKey()
      const s = buildSession(suggestedKey)
      setSession(s)
      saveActiveSession(s)
    }
    setLoading(false)
  }, [])

  const handleSessionChange = useCallback(
    (updated) => {
      setSession(updated)
      saveActiveSession(updated)
    },
    []
  )

  function handleExerciseChange(idx, updatedExercise) {
    const updatedExercises = session.exercises.map((ex, i) => (i === idx ? updatedExercise : ex))
    handleSessionChange({ ...session, exercises: updatedExercises })
  }

  function handleDayChange(dayKey) {
    const s = buildSession(dayKey)
    setSession(s)
    saveActiveSession(s)
    setDayPickerOpen(false)
  }

  function handleCompleteWorkout() {
    const completed = { ...session, completed: true }
    saveLog(completed)
    saveActiveSession(null)
    setTodayLog(completed)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const totalSets = session?.exercises.reduce((a, e) => a + e.sets.length, 0) || 0
  const doneSets = session?.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0) || 0
  const progress = totalSets > 0 ? doneSets / totalSets : 0
  const allExDone = session?.exercises.every((e) => e.sets.every((s) => s.done))

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #f97316', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // Already completed today
  if (todayLog) {
    const plan = WORKOUT_PLANS[todayLog.dayKey]
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: '90px' }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontSize: '11px', color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
            {formatDate(todayLog.date)}
          </div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '36px', letterSpacing: '0.04em', color: '#f5f5f5', lineHeight: 1 }}>
            {plan.emoji} {plan.name}
          </div>
        </div>

        {/* Done banner */}
        <div style={{ margin: '20px', padding: '20px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#22c55e', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em' }}>
            Workout Completed!
          </div>
          <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>
            {todayLog.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0)} sets · {plan.name}
          </div>
        </div>

        {/* Summary */}
        <div style={{ padding: '0 20px' }}>
          <div style={{ fontSize: '11px', color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Session Summary</div>
          {todayLog.exercises.map((ex, i) => (
            <div key={i} style={{ marginBottom: '8px', padding: '12px 14px', background: '#111', borderRadius: '12px', border: '1px solid #1e1e1e' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#ddd', marginBottom: '4px' }}>{ex.name}</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {ex.sets.map((s, si) => (
                  <span key={si} style={{ fontSize: '11px', color: '#666', background: '#1a1a1a', borderRadius: '6px', padding: '3px 8px' }}>
                    {ex.unit === 'bodyweight' ? `BW` : `${s.weight}kg`} × {s.reps}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Start new */}
        <div style={{ padding: '20px' }}>
          <button
            onClick={() => {
              const nextDay = DAY_ORDER[(DAY_ORDER.indexOf(todayLog.dayKey) + 1) % DAY_ORDER.length]
              const s = buildSession(nextDay)
              setSession(s)
              setTodayLog(null)
              saveActiveSession(s)
            }}
            style={{ width: '100%', height: '52px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px', color: '#888', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Log Another Workout Today
          </button>
        </div>
        <BottomNav />
      </div>
    )
  }

  const plan = WORKOUT_PLANS[session.dayKey]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: '90px' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', position: 'sticky', top: 0, background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(20px)', zIndex: 10, borderBottom: '1px solid #111' }}>
        <div style={{ fontSize: '11px', color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '2px' }}>
          {formatDate(getTodayStr())}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '30px', letterSpacing: '0.04em', color: '#f5f5f5', lineHeight: 1 }}>
            <span style={{ color: plan.color, marginRight: '6px' }}>{plan.emoji}</span>
            {plan.name}
          </div>
          <button
            onClick={() => setDayPickerOpen(true)}
            style={{
              padding: '6px 12px',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              color: '#888',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'inherit',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {plan.label} ↕
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '4px', background: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress * 100}%`,
                background: `linear-gradient(90deg, ${plan.color}, ${plan.color}cc)`,
                borderRadius: '2px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <span style={{ fontSize: '11px', color: '#555', whiteSpace: 'nowrap', fontWeight: '600' }}>
            {doneSets}/{totalSets}
          </span>
        </div>
      </div>

      {/* Exercise list */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {session.exercises.map((exercise, idx) => {
          const prevSets = getPreviousSetsForExercise(exercise.id, allLogs, session.date)
          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              dayColor={plan.color}
              onChange={(updated) => handleExerciseChange(idx, updated)}
              previousSets={prevSets}
            />
          )
        })}
      </div>

      {/* Complete button */}
      <div style={{ padding: '8px 16px 16px' }}>
        <button
          onClick={handleCompleteWorkout}
          disabled={!allExDone}
          style={{
            width: '100%',
            height: '56px',
            borderRadius: '16px',
            border: 'none',
            background: allExDone
              ? `linear-gradient(135deg, #22c55e, #16a34a)`
              : '#1a1a1a',
            color: allExDone ? '#fff' : '#444',
            fontSize: '15px',
            fontWeight: '700',
            cursor: allExDone ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: allExDone ? '0 4px 20px rgba(34,197,94,0.3)' : 'none',
          }}
        >
          {allExDone ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Log Workout
            </>
          ) : (
            `Complete all sets to log (${totalSets - doneSets} left)`
          )}
        </button>
      </div>

      {/* Day picker modal */}
      {dayPickerOpen && (
        <div
          onClick={() => setDayPickerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#111',
              borderRadius: '20px 20px 0 0',
              padding: '20px',
              width: '100%',
              maxWidth: '480px',
              border: '1px solid #1e1e1e',
              borderBottom: 'none',
              animation: 'slideUp 0.25s ease-out',
            }}
          >
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '0.06em', color: '#f5f5f5', marginBottom: '16px' }}>
              Select Workout Day
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {DAY_ORDER.map((key) => {
                const p = WORKOUT_PLANS[key]
                const isActive = key === session.dayKey
                return (
                  <button
                    key={key}
                    onClick={() => handleDayChange(key)}
                    style={{
                      padding: '14px 16px',
                      background: isActive ? `rgba(249,115,22,0.08)` : '#1a1a1a',
                      border: `1px solid ${isActive ? '#f97316' : '#2a2a2a'}`,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{p.emoji}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: isActive ? '#f97316' : '#ddd' }}>{p.label}</div>
                      <div style={{ fontSize: '11px', color: '#555' }}>{p.name}</div>
                    </div>
                    {isActive && (
                      <svg style={{ marginLeft: 'auto' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {saved && (
        <div style={{
          position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)',
          background: '#22c55e', color: '#000', padding: '10px 20px', borderRadius: '100px',
          fontSize: '13px', fontWeight: '700', zIndex: 200, animation: 'fadeIn 0.2s ease',
          whiteSpace: 'nowrap',
        }}>
          ✓ Workout saved!
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(8px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }
      `}</style>

      <BottomNav />
    </div>
  )
}
