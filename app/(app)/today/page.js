'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../../lib/authContext'
import {
  getPlan,
  getSessions,
  getActiveSession,
  saveActiveSession,
  clearActiveSession,
  saveSession,
  getQueueIndex,
  advanceQueue,
  updatePlanFromSession,
} from '../../../lib/firestoreService'
import {
  getToday,
  formatDateFull,
  countSets,
} from '../../../lib/utils'
import { getDayColor, getDayEmoji } from '../../../lib/workoutData'

import WeekStrip from '../../../components/WeekStrip'
import ExerciseCard from '../../../components/ExerciseCard'
import RestTimer from '../../../components/RestTimer'
import SessionSummary from '../../../components/SessionSummary'
import BottomSheet from '../../../components/BottomSheet'
import { Calendar as CalendarIcon, Check, SkipForward } from 'lucide-react'

export default function TodayPage() {
  const { user } = useAuth()
  const today = getToday()

  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState(null)
  const [allSessions, setAllSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [saving, setSaving] = useState(false)
  const [skipping, setSkipping] = useState(false)
  
  // UI State
  const [showDaySwitcher, setShowDaySwitcher] = useState(false)
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [completedSessionData, setCompletedSessionData] = useState(null)
  
  // Debounce saving active session
  const saveTimeoutRef = useRef(null)

  // ========================================
  // INITIAL DATA LOAD
  // ========================================
  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      try {
        const [planData, sessionsData, activeData, queueData] = await Promise.all([
          getPlan(user.uid),
          getSessions(user.uid),
          getActiveSession(user.uid),
          getQueueIndex(user.uid),
        ])

        setPlan(planData)
        setAllSessions(sessionsData)

        // Check if we already completed a workout today
        const todayCompleted = sessionsData.find(s => s.date === today && s.completed)
        
        if (todayCompleted) {
          // Already completed today's workout — show it as read-only
          setActiveSession(todayCompleted)
        } else if (activeData) {
          // Resume in-progress session (regardless of what date it was started)
          setActiveSession(activeData)
        } else {
          // Start a new session from the queue position
          const dayKey = queueData.currentDayKey || 'day1'
          startNewSession(dayKey, planData)
        }
      } catch (err) {
        console.error('Error loading today data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])


  // ========================================
  // SESSION MANAGEMENT
  // ========================================
  const startNewSession = useCallback((dayKey, currentPlan = plan) => {
    if (!currentPlan) return

    const dayConfig = currentPlan.days.find(d => d.key === dayKey)
    if (!dayConfig) return

    // Pre-fill sets with plan defaults (progressive overload baseline)
    const exercises = dayConfig.exercises.map(ex => ({
      ...ex,
      sets: Array.from({ length: ex.defaultSets || 3 }, () => ({
        weight: ex.defaultWeight ? String(ex.defaultWeight) : '',
        reps: ex.defaultReps ? String(ex.defaultReps) : '',
        done: false,
      }))
    }))

    const newSession = {
      date: today,
      dayKey,
      dayLabel: dayConfig.label,
      dayName: dayConfig.name,
      startedAt: new Date().toISOString(),
      completed: false,
      exercises,
    }

    setActiveSession(newSession)
    // Persist immediately
    if (user) saveActiveSession(user.uid, newSession)
  }, [plan, today, user])


  const handleSwitchDay = (dayKey) => {
    startNewSession(dayKey)
    setShowDaySwitcher(false)
  }


  // ========================================
  // SKIP DAY
  // ========================================
  const handleSkipDay = async () => {
    if (!plan || !user || skipping) return

    setSkipping(true)
    try {
      // Clear active session
      await clearActiveSession(user.uid)
      
      // Advance queue to next day
      const nextDayKey = await advanceQueue(user.uid, plan)
      
      // Start the next day's session
      startNewSession(nextDayKey)
    } catch (err) {
      console.error('Error skipping day:', err)
      alert('Failed to skip. Please try again.')
    } finally {
      setSkipping(false)
    }
  }


  // ========================================
  // EXERCISE UPDATES
  // ========================================
  const updateExercise = useCallback((exId, updater) => {
    setActiveSession(prev => {
      if (!prev || prev.completed) return prev
      
      const newExercises = prev.exercises.map(ex => {
        if (ex.id !== exId) return ex
        return updater(ex)
      })
      
      const newState = { ...prev, exercises: newExercises }
      
      // Debounce save to Firestore
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => {
        if (user && !newState.completed) saveActiveSession(user.uid, newState)
      }, 1000)

      return newState
    })
  }, [user])

  const handleUpdateSet = useCallback((exId, setIdx, field, value) => {
    updateExercise(exId, (ex) => {
      const newSets = [...ex.sets]
      newSets[setIdx] = { ...newSets[setIdx], [field]: value }
      
      // If marking as done, trigger rest timer
      if (field === 'done' && value === true) {
        setShowRestTimer(true)
      }
      
      return { ...ex, sets: newSets }
    })
  }, [updateExercise])

  const handleAddSet = useCallback((exId) => {
    updateExercise(exId, (ex) => {
      // Copy weight/reps from last set if exists
      const lastSet = ex.sets[ex.sets.length - 1]
      return {
        ...ex,
        sets: [...ex.sets, {
          weight: lastSet ? lastSet.weight : '',
          reps: lastSet ? lastSet.reps : '',
          done: false
        }]
      }
    })
  }, [updateExercise])

  const handleRemoveSet = useCallback((exId) => {
    updateExercise(exId, (ex) => {
      if (ex.sets.length <= 1) return ex
      return { ...ex, sets: ex.sets.slice(0, -1) }
    })
  }, [updateExercise])


  // ========================================
  // COMPLETION (with Progressive Overload)
  // ========================================
  const handleLogWorkout = async () => {
    if (!activeSession || !user || !plan) return
    
    setSaving(true)
    try {
      const finalSession = {
        ...activeSession,
        date: today, // Always stamp with today's calendar date
        completedAt: new Date().toISOString(),
      }
      
      // 1. Save the completed session
      await saveSession(user.uid, today, finalSession)
      
      // 2. Clear active session
      await clearActiveSession(user.uid)
      
      // 3. Progressive Overload: update plan if user lifted heavier
      const updatedPlan = await updatePlanFromSession(
        user.uid, plan, activeSession.dayKey, activeSession.exercises
      )
      if (updatedPlan) {
        setPlan(updatedPlan)
      }
      
      // 4. Advance the queue to the next day
      await advanceQueue(user.uid, plan)
      
      setActiveSession(finalSession)
      setCompletedSessionData(finalSession)
    } catch (err) {
      console.error('Error logging workout:', err)
      alert('Failed to save workout. Please try again.')
    } finally {
      setSaving(false)
    }
  }


  // ========================================
  // RENDER HELPERS
  // ========================================
  const getPreviousSessionExercise = (exId, currentDayKey) => {
    // Find last completed session of this SAME day type
    const lastSession = [...allSessions].reverse().find(s => s.completed && s.dayKey === currentDayKey && s.date !== today)
    if (!lastSession) return null
    return lastSession.exercises.find(e => e.id === exId)
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin-slow" />
      </div>
    )
  }

  if (!plan || !activeSession) {
    return <div className="p-6 text-center text-txt-muted mt-10">No plan data available.</div>
  }

  const { total: totalSets, done: doneSets } = countSets(activeSession.exercises)
  const isAllDone = totalSets > 0 && doneSets === totalSets
  const progressPercent = totalSets === 0 ? 0 : (doneSets / totalSets) * 100
  const isCompletedToday = activeSession.completed

  return (
    <div className="flex flex-col flex-1 pb-24">
      {/* Week Strip (Sticky) */}
      <div className="sticky top-0 z-40 bg-root/95 backdrop-blur-md pt-2 pb-1 border-b border-border-subtle">
        <WeekStrip 
          loggedDates={allSessions.filter(s => s.completed).map(s => s.date)}
          onDayClick={(date) => {
            // Not implemented yet: tapping past days could open a summary
          }}
        />
      </div>

      <div className="px-4 py-6">
        {/* Header */}
        <div className="mb-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-txt-muted uppercase tracking-wider">
              {formatDateFull(today)}
            </span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl tracking-wider text-txt-primary mb-1 leading-none">
                {activeSession.dayName}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: getDayColor(activeSession.dayKey) }}>
                  {activeSession.dayLabel}
                </span>
                <span className="text-txt-muted">·</span>
                <span className="text-sm text-txt-secondary">{totalSets} sets total</span>
              </div>
            </div>
            
            {!isCompletedToday && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Skip Day Button */}
                <button 
                  onClick={handleSkipDay}
                  disabled={skipping}
                  className="h-10 px-3 rounded-xl bg-card border border-border flex items-center justify-center gap-1.5 text-txt-secondary hover:text-accent hover:border-accent/50 transition-colors text-xs font-semibold"
                >
                  {skipping ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin-slow" />
                  ) : (
                    <>
                      <SkipForward className="w-4 h-4" />
                      Skip
                    </>
                  )}
                </button>
                
                {/* Switch Day Button */}
                <button 
                  onClick={() => setShowDaySwitcher(true)}
                  className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-txt-secondary hover:text-txt-primary hover:border-accent transition-colors"
                >
                  <CalendarIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-card rounded-xl border border-border p-3 mb-6 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-txt-secondary">Progress</span>
            <span className="text-txt-primary">{doneSets} / {totalSets}</span>
          </div>
          <div className="w-full h-2 bg-card-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Exercises List */}
        <div className="space-y-3">
          {activeSession.exercises.map((ex, idx) => (
            <div key={ex.id} className="animate-fade-in-up" style={{ animationDelay: `${(idx + 2) * 50}ms` }}>
              <ExerciseCard
                exercise={ex}
                index={idx}
                previousSessionExercise={getPreviousSessionExercise(ex.id, activeSession.dayKey)}
                onUpdateSet={handleUpdateSet}
                onAddSet={handleAddSet}
                onRemoveSet={handleRemoveSet}
              />
            </div>
          ))}
          
          {activeSession.exercises.length === 0 && (
            <div className="text-center py-12 bg-card border border-border border-dashed rounded-2xl">
              <div className="w-12 h-12 rounded-full bg-card-secondary mx-auto mb-3 flex items-center justify-center">
                <SkipForward className="w-6 h-6 text-txt-muted" />
              </div>
              <h3 className="text-txt-primary font-medium mb-1">Rest or Cardio Day</h3>
              <p className="text-sm text-txt-muted mb-4">No exercises configured for this day.</p>
              <button
                onClick={handleSkipDay}
                disabled={skipping}
                className="text-sm font-semibold text-accent hover:text-accent-light transition-colors"
              >
                Skip to next workout →
              </button>
            </div>
          )}
        </div>

        {/* Log Workout Button */}
        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: `${(activeSession.exercises.length + 2) * 50}ms` }}>
          {isCompletedToday ? (
            <div className="bg-success/10 border border-success/30 rounded-xl p-4 text-center text-success flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              <span className="font-semibold">Workout completed today</span>
            </div>
          ) : (
            <button
              onClick={handleLogWorkout}
              disabled={!isAllDone || saving}
              className={`w-full py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200
                ${isAllDone
                  ? 'bg-accent text-root hover:bg-accent-light active:scale-[0.98] shadow-lg shadow-accent/20'
                  : 'bg-card border border-border text-txt-muted opacity-50 cursor-not-allowed'
                }`}
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin-slow" />
              ) : (
                <>Log Workout</>
              )}
            </button>
          )}
          {!isAllDone && !isCompletedToday && totalSets > 0 && (
            <p className="text-center text-xs text-txt-muted mt-3">
              Complete all sets to log your workout
            </p>
          )}
        </div>

      </div>

      {/* Floating Rest Timer */}
      <RestTimer 
        isActive={showRestTimer} 
        onDismiss={() => setShowRestTimer(false)} 
      />

      {/* Day Switcher Bottom Sheet */}
      <BottomSheet 
        isOpen={showDaySwitcher} 
        onClose={() => setShowDaySwitcher(false)}
        title="Switch Day"
      >
        <div className="space-y-2 mt-2">
          {plan.days.map((day) => {
            const isCurrent = day.key === activeSession?.dayKey
            return (
              <button
                key={day.key}
                onClick={() => handleSwitchDay(day.key)}
                className={`w-full text-left p-4 rounded-xl border flex items-center gap-4 transition-colors
                  ${isCurrent
                    ? 'bg-accent/10 border-accent/30'
                    : 'bg-card border-border hover:border-border-strong hover:bg-card-secondary'
                  }`}
              >
                <span className="text-2xl">{getDayEmoji(day.key)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: getDayColor(day.key) }}>
                      {day.label}
                    </span>
                    {isCurrent && <span className="text-[10px] bg-accent text-root px-1.5 py-0.5 rounded uppercase font-bold">Current</span>}
                  </div>
                  <span className="text-sm font-medium text-txt-primary">{day.name}</span>
                </div>
              </button>
            )
          })}
        </div>
      </BottomSheet>

      {/* Completion Summary Overlay */}
      {completedSessionData && (
        <SessionSummary 
          session={completedSessionData} 
          onDismiss={() => setCompletedSessionData(null)} 
        />
      )}

    </div>
  )
}
