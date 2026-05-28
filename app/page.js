'use client'
import { useState, useEffect, useCallback } from 'react'
import BottomNav from '../components/BottomNav'
import ExerciseCard from '../components/ExerciseCard'
import SkipDayModal from '../components/SkipDayModal'
import { WORKOUT_PLANS, DAY_ORDER } from '../lib/workoutData'
import {
  getLocalTodayStr,
  getSuggestedDayKey,
  advanceDay,
} from '../lib/storage'
import { useWorkout } from '../lib/workoutContext'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
}

function buildSession(dayKey) {
  const plan = WORKOUT_PLANS[dayKey]
  return {
    date: getLocalTodayStr(),
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
    .filter((l) => l.date < currentDate && l.completed && !l.skipped)
    .sort((a, b) => b.date.localeCompare(a.date))
  for (const log of past) {
    const found = log.exercises?.find((e) => e.id === exId)
    if (found) return found.sets
  }
  return null
}

// Circular progress
function CircularProgress({ progress, color, size = 52, strokeWidth = 3.5 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - progress * circumference

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} fill="none"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={progress >= 1 ? '#22c55e' : color}
          strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
            filter: progress >= 1 ? 'drop-shadow(0 0 4px rgba(34,197,94,0.4))' : 'none',
          }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: '800',
        fontFamily: "'Bebas Neue', sans-serif",
        letterSpacing: '0.04em',
        color: progress >= 1 ? '#22c55e' : 'rgba(255,255,255,0.5)',
      }}>
        {Math.round(progress * 100)}%
      </div>
    </div>
  )
}

export default function TodayPage() {
  const {
    logs: allLogs,
    activeSession: contextActiveSession,
    loading: contextLoading,
    saveLog: contextSaveLog,
    saveActiveSession: contextSaveActiveSession,
  } = useWorkout()

  const [session, setSession] = useState(null)
  const [todayLog, setTodayLog] = useState(null)
  const [dayPickerOpen, setDayPickerOpen] = useState(false)
  const [skipModalOpen, setSkipModalOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [addExOpen, setAddExOpen] = useState(false)
  const [newExName, setNewExName] = useState('')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (contextLoading || initialized) return

    const today = getLocalTodayStr()
    const existing = allLogs.find((l) => l.date === today)
    if (existing && existing.completed) {
      setTodayLog(existing)
      setSession(null)
      setInitialized(true)
      return
    } else {
      setTodayLog(null)
    }

    if (contextActiveSession && contextActiveSession.date === today) {
      setSession(contextActiveSession)
    } else {
      const suggestedKey = getSuggestedDayKey(allLogs)
      const s = buildSession(suggestedKey)
      setSession(s)
      contextSaveActiveSession(s)
    }
    setInitialized(true)
  }, [contextLoading, initialized, allLogs, contextActiveSession, contextSaveActiveSession])

  // Sync state updates reactively to contexts
  const handleSessionChange = useCallback((updated) => {
    setSession(updated)
    contextSaveActiveSession(updated)
  }, [contextSaveActiveSession])

  function handleExerciseChange(idx, updatedExercise) {
    const updatedExercises = session.exercises.map((ex, i) => (i === idx ? updatedExercise : ex))
    handleSessionChange({ ...session, exercises: updatedExercises })
  }

  function handleDayChange(dayKey) {
    const s = buildSession(dayKey)
    setSession(s)
    contextSaveActiveSession(s)
    setDayPickerOpen(false)
  }

  function handleSkipDay() {
    const nextKey = advanceDay(allLogs, contextSaveLog)
    const s = buildSession(nextKey)
    setSession(s)
    contextSaveActiveSession(s)
    setSkipModalOpen(false)
  }

  function handleCompleteWorkout() {
    const completed = { ...session, completed: true }
    contextSaveLog(completed)
    contextSaveActiveSession(null)
    setTodayLog(completed)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function handleAddExercise() {
    if (!newExName.trim()) return
    const newEx = {
      id: 'custom_' + Date.now(),
      name: newExName.trim(),
      unit: 'kg',
      sets: [
        { weight: '', reps: 10, done: false },
        { weight: '', reps: 10, done: false },
        { weight: '', reps: 10, done: false },
      ],
    }
    handleSessionChange({ ...session, exercises: [...session.exercises, newEx] })
    setNewExName('')
    setAddExOpen(false)
  }

  const totalSets = session?.exercises.reduce((a, e) => a + e.sets.length, 0) || 0
  const doneSets = session?.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0) || 0
  const progress = totalSets > 0 ? doneSets / totalSets : 0
  const allExDone = session?.exercises.every((e) => e.sets.every((s) => s.done))

  if (contextLoading || (!session && !todayLog)) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
        <div className="animate-spin" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.05)', borderTopColor: '#f97316' }} />
      </div>
    )
  }

  // ======================================
  // COMPLETED STATE
  // ======================================
  if (todayLog) {
    const plan = WORKOUT_PLANS[todayLog.dayKey]
    const nextDayKey = DAY_ORDER[(DAY_ORDER.indexOf(todayLog.dayKey) + 1) % DAY_ORDER.length]
    const nextPlan = WORKOUT_PLANS[nextDayKey]
    const totalVol = todayLog.exercises.reduce(
      (a, e) => a + e.sets.reduce((s, set) => s + (set.done ? (set.weight || 0) * (set.reps || 0) : 0), 0), 0
    )
    const totalSetsCompleted = todayLog.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0)

    return (
      <div style={{ minHeight: '100dvh', background: '#050505' }} className="safe-bottom">
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
            {formatDate(todayLog.date)}
          </div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '34px', letterSpacing: '0.04em', color: '#f0f0f0', lineHeight: 1 }}>
            {plan.name}
          </div>
        </div>

        {/* Completion card */}
        <div className="animate-scale-pop" style={{
          margin: '28px 20px',
          padding: '32px 24px',
          background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(34,197,94,0.02))',
          border: '1px solid rgba(34,197,94,0.12)',
          borderRadius: '24px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div style={{
            fontSize: '22px', fontWeight: '800', color: '#22c55e',
            fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.06em', marginBottom: '20px',
          }}>
            Workout Complete
          </div>
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '32px',
          }}>
            {[
              { value: totalSetsCompleted, label: 'Sets' },
              { value: totalVol > 0 ? `${(totalVol / 1000).toFixed(1)}t` : 'BW', label: 'Volume' },
              { value: todayLog.exercises.length, label: 'Exercises' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{
                  fontSize: '22px', fontWeight: '800', color: '#f0f0f0',
                  fontFamily: "'Bebas Neue', sans-serif",
                }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exercise summary */}
        <div style={{ padding: '0 20px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px', fontWeight: '600' }}>
            Summary
          </div>
          <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {todayLog.exercises.map((ex, i) => (
              <div key={i} style={{
                padding: '14px 16px', background: 'rgba(255,255,255,0.02)',
                borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>{ex.name}</div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {ex.sets.filter((s) => s.done).map((s, si) => (
                    <span key={si} style={{
                      fontSize: '11px', color: 'rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '3px 8px',
                      border: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      {ex.unit === 'bodyweight' ? 'BW' : `${s.weight}kg`} × {s.reps}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next workout */}
        <div style={{ padding: '24px 20px' }}>
          <button
            onClick={() => {
              const s = buildSession(nextDayKey)
              setSession(s)
              setTodayLog(null)
              contextSaveActiveSession(s)
            }}
            style={{
              width: '100%', padding: '18px', background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: '14px',
              textAlign: 'left',
              transition: 'border-color 0.2s ease',
            }}
          >
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: `${nextPlan.color}0A`, border: `1px solid ${nextPlan.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={nextPlan.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Start Next
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#eee', marginTop: '2px' }}>
                {nextPlan.label} — {nextPlan.name}
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <BottomNav />
      </div>
    )
  }

  // ======================================
  // ACTIVE SESSION
  // ======================================
  const plan = WORKOUT_PLANS[session.dayKey]

  return (
    <div style={{ minHeight: '100dvh', background: '#050505' }} className="safe-bottom">
      {/* Sticky header */}
      <div style={{
        padding: '16px 20px 14px',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(5,5,5,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}>
        {/* Date */}
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
          {formatDate(getLocalTodayStr())}
        </div>

        {/* Day name + progress + controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <CircularProgress progress={progress} color={plan.color} size={52} strokeWidth={3.5} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '24px',
              letterSpacing: '0.04em', color: '#f0f0f0', lineHeight: 1.1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {plan.name}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>
              {doneSets}/{totalSets} sets · {plan.label}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={() => setSkipModalOpen(true)}
              aria-label="Skip this workout"
              style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" />
              </svg>
            </button>
            <button
              onClick={() => setDayPickerOpen(true)}
              aria-label="Change workout day"
              style={{
                height: '40px', padding: '0 14px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '700',
                cursor: 'pointer', fontFamily: 'inherit',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}
            >
              {plan.label}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Exercise list */}
      <div className="stagger-children" style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {session.exercises.map((exercise, idx) => {
          const prevSets = getPreviousSetsForExercise(exercise.id, allLogs, session.date)
          return (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              dayColor={plan.color}
              onChange={(updated) => handleExerciseChange(idx, updated)}
              previousSets={prevSets}
              index={idx}
            />
          )
        })}
      </div>

      {/* Add exercise */}
      <div style={{ padding: '0 16px 8px' }}>
        {addExOpen ? (
          <div className="animate-fade-in" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={newExName}
              onChange={(e) => setNewExName(e.target.value)}
              placeholder="Exercise name..."
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddExercise()}
              style={{
                flex: 1, height: '48px', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px',
                color: '#eee', fontSize: '14px', padding: '0 16px',
                outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleAddExercise}
              style={{
                height: '48px', padding: '0 18px', borderRadius: '14px',
                background: plan.color, border: 'none',
                color: '#fff', fontSize: '14px', fontWeight: '700',
                cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
              }}
            >
              Add
            </button>
            <button
              onClick={() => { setAddExOpen(false); setNewExName('') }}
              style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddExOpen(true)}
            style={{
              width: '100%', height: '44px', borderRadius: '14px',
              background: 'transparent', border: '1px dashed rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.15)', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Exercise
          </button>
        )}
      </div>

      {/* Log button — sticky bottom */}
      <div style={{
        position: 'sticky', bottom: '72px', padding: '12px 16px 16px',
        background: 'linear-gradient(to top, rgba(5,5,5,1) 60%, rgba(5,5,5,0))',
        zIndex: 5,
      }}>
        <button
          onClick={handleCompleteWorkout}
          disabled={!allExDone}
          style={{
            width: '100%', height: '56px', borderRadius: '16px',
            border: 'none',
            background: allExDone
              ? 'linear-gradient(135deg, #22c55e, #15803d)'
              : 'rgba(255,255,255,0.03)',
            color: allExDone ? '#fff' : 'rgba(255,255,255,0.2)',
            fontSize: '15px', fontWeight: '700',
            cursor: allExDone ? 'pointer' : 'default',
            fontFamily: 'inherit', letterSpacing: '0.03em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.3s ease',
            boxShadow: allExDone ? '0 4px 24px rgba(34,197,94,0.25)' : 'none',
            border: allExDone ? 'none' : '1px solid rgba(255,255,255,0.04)',
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
            `${totalSets - doneSets} sets remaining`
          )}
        </button>
      </div>

      {/* Day picker */}
      {dayPickerOpen && (
        <div
          className="overlay-backdrop"
          onClick={() => setDayPickerOpen(false)}
          style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-slide-up"
            style={{
              background: '#0c0c0c',
              borderRadius: '24px 24px 0 0',
              padding: '24px 20px',
              paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
              width: '100%', maxWidth: '480px',
              border: '1px solid rgba(255,255,255,0.04)',
              borderBottom: 'none',
            }}
          >
            <div style={{ width: '36px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '24px',
              letterSpacing: '0.06em', color: '#f0f0f0', marginBottom: '16px',
            }}>
              Select Workout
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
                      padding: '16px',
                      background: isActive ? `${p.color}08` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isActive ? `${p.color}25` : 'rgba(255,255,255,0.04)'}`,
                      borderRadius: '16px',
                      display: 'flex', alignItems: 'center', gap: '14px',
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                      minHeight: '56px',
                    }}
                  >
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '12px',
                      background: `${p.color}0A`, border: `1px solid ${p.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <div style={{
                        width: '12px', height: '12px', borderRadius: '50%',
                        background: isActive ? p.color : `${p.color}50`,
                        boxShadow: isActive ? `0 0 8px ${p.color}40` : 'none',
                      }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: isActive ? p.color : '#ccc' }}>
                        {p.label} — {p.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '2px' }}>
                        {p.exercises.length} exercises
                      </div>
                    </div>
                    {isActive && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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

      {/* Skip modal */}
      {skipModalOpen && (
        <SkipDayModal
          currentDayKey={session.dayKey}
          onSkip={handleSkipDay}
          onKeep={() => setSkipModalOpen(false)}
          onClose={() => setSkipModalOpen(false)}
        />
      )}

      {/* Toast */}
      {saved && (
        <div className="animate-toast" style={{
          position: 'fixed', bottom: '96px', left: '50%', transform: 'translateX(-50%)',
          background: '#22c55e', color: '#000', padding: '12px 24px', borderRadius: '100px',
          fontSize: '14px', fontWeight: '700', zIndex: 200,
          whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(34,197,94,0.3)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Workout logged!
          </span>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
