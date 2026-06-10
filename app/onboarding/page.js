'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/authContext'
import { seedDefaultData } from '../../lib/firestoreService'
import { DEFAULT_PLAN, FITNESS_GOALS } from '../../lib/workoutData'
import { calculateBMI, getBMIClassification, generateId } from '../../lib/utils'
import { ChevronLeft, ChevronRight, Check, Plus, X, Dumbbell } from 'lucide-react'

export default function OnboardingPage() {
  const { user, loading, isNewUser, setIsNewUser } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Profile state
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [goal, setGoal] = useState(FITNESS_GOALS[0])

  // Plan state
  const [planChoice, setPlanChoice] = useState('recommended') // 'recommended' | 'custom'
  const [customDays, setCustomDays] = useState(
    Array.from({ length: 6 }, (_, i) => ({
      key: `day${i + 1}`,
      label: `Day ${i + 1}`,
      name: '',
      emoji: ['🏋️', '💪', '🦵', '🔥', '🦿', '🏃'][i],
      color: ['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'][i],
      exercises: [],
    }))
  )
  const [newExerciseInputs, setNewExerciseInputs] = useState({})

  // Guard: redirect if not authenticated or not a new user
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/')
    } else if (!loading && user && !isNewUser) {
      router.replace('/today')
    }
  }, [user, loading, isNewUser, router])

  // BMI preview
  const bmi = calculateBMI(parseFloat(weight), parseFloat(height))
  const bmiClass = getBMIClassification(bmi)

  // Auto-populate name from Google profile
  useEffect(() => {
    if (user?.displayName && !name) {
      setName(user.displayName)
    }
  }, [user, name])

  // ========================================
  // STEP 1: Profile
  // ========================================
  const isStep1Valid = name.trim() && age && weight && height

  // ========================================
  // STEP 2: Plan
  // ========================================
  const addExerciseToDay = (dayIndex) => {
    const input = newExerciseInputs[dayIndex]?.trim()
    if (!input) return
    setCustomDays(prev => {
      const updated = [...prev]
      updated[dayIndex] = {
        ...updated[dayIndex],
        exercises: [
          ...updated[dayIndex].exercises,
          { id: generateId(), name: input, defaultSets: 3, defaultReps: 10, unit: 'kg' },
        ],
      }
      return updated
    })
    setNewExerciseInputs(prev => ({ ...prev, [dayIndex]: '' }))
  }

  const removeExerciseFromDay = (dayIndex, exId) => {
    setCustomDays(prev => {
      const updated = [...prev]
      updated[dayIndex] = {
        ...updated[dayIndex],
        exercises: updated[dayIndex].exercises.filter(e => e.id !== exId),
      }
      return updated
    })
  }

  const updateDayName = (dayIndex, newName) => {
    setCustomDays(prev => {
      const updated = [...prev]
      updated[dayIndex] = { ...updated[dayIndex], name: newName }
      return updated
    })
  }

  // ========================================
  // STEP 3: Confirm & Save
  // ========================================
  const selectedPlan = planChoice === 'recommended' ? DEFAULT_PLAN : { days: customDays }

  const handleComplete = async () => {
    setSaving(true)
    setError(null)
    try {
      const profile = {
        name: name.trim(),
        age: parseInt(age),
        weight: parseFloat(weight),
        height: parseFloat(height),
        goal,
      }
      await seedDefaultData(user.uid, profile, selectedPlan)
      setIsNewUser(false)
      router.replace('/today')
    } catch (err) {
      console.error('Error saving onboarding data:', err)
      setError('Failed to save. Please try again.')
      setSaving(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-root">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin-slow" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-root">
      <div className="app-container px-6 py-8">

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                  ${step >= s
                    ? 'bg-accent text-root'
                    : 'bg-card border border-border text-txt-muted'
                  }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-10 h-0.5 rounded-full transition-colors duration-300 ${step > s ? 'bg-accent' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* STEP 1 — Profile */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h1 className="font-display text-4xl tracking-wider mb-1">SET UP YOUR PROFILE</h1>
            <p className="text-txt-secondary text-sm mb-8">Tell us a bit about yourself</p>

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs text-txt-secondary uppercase tracking-wider mb-2">Name</label>
                <input
                  id="onb-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-txt-primary placeholder:text-txt-muted focus:border-accent transition-colors"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs text-txt-secondary uppercase tracking-wider mb-2">Age</label>
                <input
                  id="onb-age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="25"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-txt-primary placeholder:text-txt-muted focus:border-accent transition-colors"
                />
              </div>

              {/* Weight + Height row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-txt-secondary uppercase tracking-wider mb-2">Weight (kg)</label>
                  <input
                    id="onb-weight"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="70"
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-txt-primary placeholder:text-txt-muted focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-txt-secondary uppercase tracking-wider mb-2">Height (cm)</label>
                  <input
                    id="onb-height"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="175"
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-txt-primary placeholder:text-txt-muted focus:border-accent transition-colors"
                  />
                </div>
              </div>

              {/* BMI Preview */}
              {bmi && (
                <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between animate-fade-in">
                  <span className="text-sm text-txt-secondary">Your BMI</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-txt-primary">{bmi}</span>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: bmiClass.color + '20', color: bmiClass.color }}
                    >
                      {bmiClass.label}
                    </span>
                  </div>
                </div>
              )}

              {/* Goal */}
              <div>
                <label className="block text-xs text-txt-secondary uppercase tracking-wider mb-2">Fitness Goal</label>
                <select
                  id="onb-goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-txt-primary focus:border-accent transition-colors appearance-none"
                >
                  {FITNESS_GOALS.map(g => (
                    <option key={g} value={g} className="bg-card">{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Next */}
            <button
              onClick={() => setStep(2)}
              disabled={!isStep1Valid}
              className={`w-full mt-8 py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200
                ${isStep1Valid
                  ? 'bg-accent text-root hover:bg-accent-light active:scale-[0.98]'
                  : 'bg-card text-txt-muted cursor-not-allowed border border-border'
                }`}
            >
              Continue <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 2 — Plan */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h1 className="font-display text-4xl tracking-wider mb-1">YOUR WORKOUT PLAN</h1>
            <p className="text-txt-secondary text-sm mb-8">Choose your training split</p>

            {/* Plan choice cards */}
            <div className="space-y-3 mb-6">
              {/* Recommended */}
              <button
                onClick={() => setPlanChoice('recommended')}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                  ${planChoice === 'recommended'
                    ? 'border-accent bg-accent/5'
                    : 'border-border bg-card hover:border-border-strong'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${planChoice === 'recommended' ? 'bg-accent' : 'bg-card-secondary'}`}>
                    <Dumbbell className={`w-5 h-5 ${planChoice === 'recommended' ? 'text-root' : 'text-txt-muted'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-txt-primary">Use Recommended Plan</h3>
                    <p className="text-xs text-txt-secondary">6-day PPL split from your trainer</p>
                  </div>
                  {planChoice === 'recommended' && (
                    <Check className="w-5 h-5 text-accent ml-auto" />
                  )}
                </div>
              </button>

              {/* Custom */}
              <button
                onClick={() => setPlanChoice('custom')}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                  ${planChoice === 'custom'
                    ? 'border-accent bg-accent/5'
                    : 'border-border bg-card hover:border-border-strong'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${planChoice === 'custom' ? 'bg-accent' : 'bg-card-secondary'}`}>
                    <Plus className={`w-5 h-5 ${planChoice === 'custom' ? 'text-root' : 'text-txt-muted'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-txt-primary">Build My Own Plan</h3>
                    <p className="text-xs text-txt-secondary">Name each day and add exercises</p>
                  </div>
                  {planChoice === 'custom' && (
                    <Check className="w-5 h-5 text-accent ml-auto" />
                  )}
                </div>
              </button>
            </div>

            {/* Recommended Plan Preview */}
            {planChoice === 'recommended' && (
              <div className="space-y-2 mb-6 stagger-children">
                {DEFAULT_PLAN.days.map((day) => (
                  <div key={day.key} className="bg-card rounded-xl px-4 py-3 border border-border-subtle flex items-center gap-3">
                    <span className="text-lg">{day.emoji}</span>
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: day.color }}>
                        {day.label}
                      </span>
                      <p className="text-sm text-txt-primary font-medium">{day.name}</p>
                    </div>
                    <span className="ml-auto text-xs text-txt-muted">
                      {day.exercises.length} exercises
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Custom Plan Editor */}
            {planChoice === 'custom' && (
              <div className="space-y-4 mb-6">
                {customDays.map((day, dayIdx) => (
                  <div key={day.key} className="bg-card rounded-xl border border-border-subtle p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{day.emoji}</span>
                      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: day.color }}>
                        {day.label}
                      </span>
                      <span className="text-txt-muted">·</span>
                      <input
                        type="text"
                        value={day.name}
                        onChange={(e) => updateDayName(dayIdx, e.target.value)}
                        placeholder="e.g. Push Day"
                        className="flex-1 bg-transparent text-sm text-txt-primary placeholder:text-txt-muted"
                      />
                    </div>

                    {/* Exercise list */}
                    {day.exercises.length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        {day.exercises.map((ex) => (
                          <div key={ex.id} className="flex items-center gap-2 bg-card-secondary rounded-lg px-3 py-2">
                            <span className="text-sm text-txt-primary flex-1">{ex.name}</span>
                            <button
                              onClick={() => removeExerciseFromDay(dayIdx, ex.id)}
                              className="text-txt-muted hover:text-danger transition-colors p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add exercise input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newExerciseInputs[dayIdx] || ''}
                        onChange={(e) => setNewExerciseInputs(prev => ({ ...prev, [dayIdx]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addExerciseToDay(dayIdx)}
                        placeholder="Add exercise..."
                        className="flex-1 bg-card-secondary rounded-lg px-3 py-2 text-sm text-txt-primary placeholder:text-txt-muted"
                      />
                      <button
                        onClick={() => addExerciseToDay(dayIdx)}
                        className="bg-accent/10 text-accent rounded-lg px-3 py-2 hover:bg-accent/20 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-xl bg-card border border-border text-txt-primary font-medium flex items-center justify-center gap-2 hover:bg-card-secondary active:scale-[0.98] transition-all"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-[2] py-4 rounded-xl bg-accent text-root font-semibold flex items-center justify-center gap-2 hover:bg-accent-light active:scale-[0.98] transition-all"
              >
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Confirmation */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="text-center mb-10">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-amber-500 flex items-center justify-center mx-auto mb-6 animate-scale-pop">
                <Check className="w-10 h-10 text-root" strokeWidth={2.5} />
              </div>
              <h1 className="font-display text-4xl tracking-wider mb-2">ALL SET, {name.split(' ')[0].toUpperCase()}!</h1>
              <p className="text-txt-secondary text-sm">Here's a summary of your setup</p>
            </div>

            {/* Summary */}
            <div className="space-y-3 mb-10">
              {/* Profile summary */}
              <div className="bg-card rounded-xl border border-border-subtle p-4">
                <h3 className="text-xs text-txt-secondary uppercase tracking-wider mb-3">Profile</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-txt-secondary">Name</span>
                  <span className="text-txt-primary text-right">{name}</span>
                  <span className="text-txt-secondary">Age</span>
                  <span className="text-txt-primary text-right">{age}</span>
                  <span className="text-txt-secondary">Weight</span>
                  <span className="text-txt-primary text-right">{weight} kg</span>
                  <span className="text-txt-secondary">Height</span>
                  <span className="text-txt-primary text-right">{height} cm</span>
                  <span className="text-txt-secondary">Goal</span>
                  <span className="text-txt-primary text-right">{goal}</span>
                  {bmi && (
                    <>
                      <span className="text-txt-secondary">BMI</span>
                      <span className="text-right" style={{ color: bmiClass.color }}>
                        {bmi} · {bmiClass.label}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Plan summary */}
              <div className="bg-card rounded-xl border border-border-subtle p-4">
                <h3 className="text-xs text-txt-secondary uppercase tracking-wider mb-3">
                  {planChoice === 'recommended' ? 'Recommended Plan' : 'Custom Plan'}
                </h3>
                <div className="space-y-2">
                  {selectedPlan.days.map((day) => (
                    <div key={day.key} className="flex items-center gap-2 text-sm">
                      <span>{day.emoji}</span>
                      <span className="text-xs font-medium" style={{ color: day.color }}>{day.label}</span>
                      <span className="text-txt-primary">{day.name || '—'}</span>
                      <span className="ml-auto text-txt-muted text-xs">{day.exercises.length} ex</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-danger/10 border border-danger/25 rounded-xl px-4 py-3 mb-4 text-sm text-danger animate-fade-in">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 rounded-xl bg-card border border-border text-txt-primary font-medium flex items-center justify-center gap-2 hover:bg-card-secondary active:scale-[0.98] transition-all"
              >
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
              <button
                onClick={handleComplete}
                disabled={saving}
                className="flex-[2] py-4 rounded-xl bg-accent text-root font-semibold flex items-center justify-center gap-2 hover:bg-accent-light active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-root border-t-transparent rounded-full animate-spin-slow" />
                ) : (
                  <>Let's Go 🔥</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
