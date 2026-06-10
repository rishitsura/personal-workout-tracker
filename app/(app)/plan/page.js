'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../../lib/authContext'
import { getPlan, savePlan } from '../../../lib/firestoreService'
import { getDayColor, getDayEmoji } from '../../../lib/workoutData'
import { generateId } from '../../../lib/utils'

import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2, Edit2 } from 'lucide-react'

export default function PlanPage() {
  const { user } = useAuth()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // UI State
  const [expandedDay, setExpandedDay] = useState(null)
  const [newExInputs, setNewExInputs] = useState({})
  const saveTimeoutRef = useRef(null)

  // ========================================
  // LOAD PLAN
  // ========================================
  useEffect(() => {
    if (!user) return
    const loadPlan = async () => {
      try {
        const data = await getPlan(user.uid)
        setPlan(data)
      } catch (err) {
        console.error('Error loading plan:', err)
      } finally {
        setLoading(false)
      }
    }
    loadPlan()
  }, [user])

  // ========================================
  // AUTO-SAVE LOGIC
  // ========================================
  const persistPlan = (newPlan) => {
    setPlan(newPlan)
    if (!user) return
    
    setSaving(true)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await savePlan(user.uid, newPlan)
      } catch (err) {
        console.error('Error saving plan:', err)
      } finally {
        setSaving(false)
      }
    }, 1000)
  }

  // ========================================
  // UPDATE HELPERS
  // ========================================
  const updateDay = (dayKey, updater) => {
    if (!plan) return
    const newDays = plan.days.map(d => {
      if (d.key !== dayKey) return d
      return updater(d)
    })
    persistPlan({ ...plan, days: newDays })
  }

  const handleUpdateDayName = (dayKey, newName) => {
    updateDay(dayKey, d => ({ ...d, name: newName }))
  }

  const handleAddExercise = (dayKey) => {
    const name = newExInputs[dayKey]?.trim()
    if (!name) return

    updateDay(dayKey, d => ({
      ...d,
      exercises: [
        ...d.exercises,
        { id: generateId(), name, defaultSets: 3, defaultReps: 10, unit: 'kg' }
      ]
    }))
    
    setNewExInputs(prev => ({ ...prev, [dayKey]: '' }))
  }

  const handleUpdateExerciseName = (dayKey, exId, newName) => {
    updateDay(dayKey, d => ({
      ...d,
      exercises: d.exercises.map(ex => ex.id === exId ? { ...ex, name: newName } : ex)
    }))
  }

  const handleDeleteExercise = (dayKey, exId) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return
    updateDay(dayKey, d => ({
      ...d,
      exercises: d.exercises.filter(ex => ex.id !== exId)
    }))
  }

  // Simple drag-to-reorder logic (move up/down)
  const handleMoveExercise = (dayKey, fromIndex, direction) => {
    const toIndex = fromIndex + direction
    updateDay(dayKey, d => {
      if (toIndex < 0 || toIndex >= d.exercises.length) return d
      const newExs = [...d.exercises]
      const temp = newExs[fromIndex]
      newExs[fromIndex] = newExs[toIndex]
      newExs[toIndex] = temp
      return { ...d, exercises: newExs }
    })
  }


  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin-slow" />
      </div>
    )
  }

  if (!plan) {
    return <div className="p-6 text-center text-txt-muted mt-10">No plan data available.</div>
  }

  return (
    <div className="flex flex-col flex-1 pb-10">
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-root/95 backdrop-blur-md pt-12 pb-4 px-6 border-b border-border-subtle">
        <div className="flex items-end justify-between">
          <h1 className="font-display text-4xl tracking-wider text-txt-primary leading-none">YOUR PLAN</h1>
          {saving && <span className="text-[10px] font-semibold text-accent uppercase tracking-wider animate-pulse">Saving...</span>}
        </div>
      </div>

      <div className="px-4 py-6">
        <p className="text-sm text-txt-secondary mb-6">
          Customize your 6-day training split. Changes are saved automatically.
        </p>

        <div className="space-y-4">
          {plan.days.map((day, idx) => {
            const isExpanded = expandedDay === day.key
            const color = getDayColor(day.key)
            
            return (
              <div key={day.key} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                
                {/* Accordion Header */}
                <button
                  onClick={() => setExpandedDay(isExpanded ? null : day.key)}
                  className="w-full p-4 flex items-center justify-between hover:bg-card-secondary transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{getDayEmoji(day.key)}</span>
                    <div className="text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5" style={{ color }}>
                        {day.label}
                      </span>
                      <span className="text-sm font-semibold text-txt-primary">{day.name || 'Rest Day'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-txt-muted">{day.exercises.length} ex</span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-txt-muted" /> : <ChevronDown className="w-5 h-5 text-txt-muted" />}
                  </div>
                </button>

                {/* Expanded Editor */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-border-subtle bg-card-secondary/20 animate-slide-down">
                    
                    {/* Day Name Edit */}
                    <div className="mt-4 mb-6">
                      <label className="block text-[10px] text-txt-muted font-bold uppercase tracking-wider mb-2">Day Name</label>
                      <input
                        type="text"
                        value={day.name}
                        onChange={(e) => handleUpdateDayName(day.key, e.target.value)}
                        placeholder="e.g. Chest & Triceps"
                        className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-txt-primary focus:border-accent transition-colors"
                      />
                    </div>

                    {/* Exercises List */}
                    <div className="mb-2">
                      <label className="block text-[10px] text-txt-muted font-bold uppercase tracking-wider mb-2">Exercises</label>
                      
                      {day.exercises.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-border rounded-xl text-txt-muted text-sm">
                          No exercises added yet
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {day.exercises.map((ex, i) => (
                            <div key={ex.id} className="flex items-center gap-2 bg-card border border-border-subtle rounded-xl p-2 group">
                              <div className="flex flex-col gap-1 text-txt-muted px-1">
                                <button 
                                  onClick={() => handleMoveExercise(day.key, i, -1)}
                                  disabled={i === 0}
                                  className="hover:text-txt-primary disabled:opacity-30 disabled:hover:text-txt-muted"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleMoveExercise(day.key, i, 1)}
                                  disabled={i === day.exercises.length - 1}
                                  className="hover:text-txt-primary disabled:opacity-30 disabled:hover:text-txt-muted"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              </div>
                              
                              <input
                                type="text"
                                value={ex.name}
                                onChange={(e) => handleUpdateExerciseName(day.key, ex.id, e.target.value)}
                                className="flex-1 bg-transparent border-none text-sm text-txt-primary px-2 focus:ring-0"
                              />
                              
                              <button
                                onClick={() => handleDeleteExercise(day.key, ex.id)}
                                className="p-2 text-txt-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Add Exercise */}
                    <div className="flex gap-2 mt-4">
                      <input
                        type="text"
                        value={newExInputs[day.key] || ''}
                        onChange={(e) => setNewExInputs(prev => ({ ...prev, [day.key]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddExercise(day.key)}
                        placeholder="Add new exercise..."
                        className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-txt-primary placeholder:text-txt-muted focus:border-accent transition-colors"
                      />
                      <button
                        onClick={() => handleAddExercise(day.key)}
                        disabled={!newExInputs[day.key]?.trim()}
                        className="w-12 rounded-xl bg-accent text-root flex items-center justify-center disabled:opacity-50 transition-colors hover:bg-accent-light"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                  </div>
                )}

              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
