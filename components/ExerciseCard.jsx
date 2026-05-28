'use client'
import { useState, useRef } from 'react'

export default function ExerciseCard({ exercise, dayColor, onChange, previousSets, index }) {
  const [expanded, setExpanded] = useState(true)
  const cardRef = useRef(null)

  const allDone = exercise.sets.every((s) => s.done)
  const someDone = exercise.sets.some((s) => s.done)
  const doneCount = exercise.sets.filter((s) => s.done).length

  function updateSet(idx, field, value) {
    const updated = exercise.sets.map((s, i) =>
      i === idx ? { ...s, [field]: field === 'done' ? value : value === '' ? '' : parseFloat(value) || 0 } : s
    )
    onChange({ ...exercise, sets: updated })
  }

  function toggleSetDone(idx) {
    const set = exercise.sets[idx]
    if (!set.done && (set.weight === '' || set.weight === 0) && previousSets?.[idx]) {
      const prev = previousSets[idx]
      const updated = exercise.sets.map((s, i) =>
        i === idx ? { ...s, weight: prev.weight, reps: s.reps || prev.reps, done: true } : s
      )
      onChange({ ...exercise, sets: updated })
    } else {
      updateSet(idx, 'done', !set.done)
    }
  }

  function adjustWeight(idx, delta) {
    const current = exercise.sets[idx].weight === '' ? 0 : exercise.sets[idx].weight
    const newVal = Math.max(0, current + delta)
    updateSet(idx, 'weight', newVal)
  }

  function adjustReps(idx, delta) {
    const current = exercise.sets[idx].reps === '' ? 0 : exercise.sets[idx].reps
    const newVal = Math.max(1, current + delta)
    updateSet(idx, 'reps', newVal)
  }

  function addSet() {
    const lastSet = exercise.sets[exercise.sets.length - 1] || { weight: 0, reps: 10, done: false }
    onChange({
      ...exercise,
      sets: [...exercise.sets, { weight: lastSet.weight, reps: lastSet.reps, done: false }],
    })
  }

  function removeSet(idx) {
    if (exercise.sets.length <= 1) return
    onChange({ ...exercise, sets: exercise.sets.filter((_, i) => i !== idx) })
  }

  const isBodyweight = exercise.unit === 'bodyweight'
  const isTime = exercise.unit === 'min'
  const prevBest = previousSets
    ? Math.max(...previousSets.filter((s) => s.weight > 0).map((s) => s.weight), 0)
    : 0

  // Progress percentage for the card
  const progressPct = exercise.sets.length > 0 ? (doneCount / exercise.sets.length) * 100 : 0

  return (
    <div
      ref={cardRef}
      style={{
        background: '#0c0c0c',
        borderRadius: '20px',
        border: allDone ? '1px solid rgba(34,197,94,0.18)' : '1px solid rgba(255,255,255,0.04)',
        overflow: 'hidden',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
        boxShadow: allDone
          ? '0 0 24px rgba(34,197,94,0.06)'
          : '0 2px 8px rgba(0,0,0,0.3)',
        position: 'relative',
      }}
    >
      {/* Subtle progress bar at top of card */}
      <div style={{
        height: '2px',
        background: '#111',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          left: 0, top: 0, height: '100%',
          width: `${progressPct}%`,
          background: allDone
            ? 'linear-gradient(90deg, #22c55e, #16a34a)'
            : `linear-gradient(90deg, ${dayColor}, ${dayColor}aa)`,
          borderRadius: '0 1px 1px 0',
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '16px 18px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          gap: '14px',
          textAlign: 'left',
          minHeight: '60px',
        }}
      >
        {/* Status ring */}
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: allDone
            ? 'rgba(34,197,94,0.12)'
            : someDone
              ? `${dayColor}12`
              : 'rgba(255,255,255,0.03)',
          border: allDone
            ? '1.5px solid rgba(34,197,94,0.25)'
            : someDone
              ? `1.5px solid ${dayColor}30`
              : '1.5px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.25s ease',
        }}>
          {allDone ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <span style={{
              fontSize: '13px', fontWeight: '800',
              color: someDone ? dayColor : '#3a3a3a',
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: '0.04em',
            }}>
              {doneCount}/{exercise.sets.length}
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '15px', fontWeight: '600',
            color: allDone ? 'rgba(255,255,255,0.35)' : '#eee',
            textDecoration: allDone ? 'line-through' : 'none',
            textDecorationColor: 'rgba(255,255,255,0.15)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            lineHeight: 1.3,
          }}>
            {exercise.name}
          </div>
          {prevBest > 0 && !isBodyweight && !isTime && (
            <div style={{
              fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '3px',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
              </svg>
              Best: {prevBest}kg
            </div>
          )}
        </div>

        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease',
            flexShrink: 0,
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Sets */}
      {expanded && (
        <div style={{ padding: '0 18px 18px' }}>
          {/* Set rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {exercise.sets.map((set, idx) => {
              const prevSet = previousSets?.[idx]
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 0',
                  }}
                >
                  {/* Set number */}
                  <div style={{
                    width: '24px', textAlign: 'center',
                    fontSize: '12px', fontWeight: '700',
                    color: set.done ? '#22c55e' : 'rgba(255,255,255,0.18)',
                    fontFamily: "'Bebas Neue', sans-serif",
                    letterSpacing: '0.04em',
                    flexShrink: 0,
                  }}>
                    {idx + 1}
                  </div>

                  {/* Inputs area — fills remaining space */}
                  {isBodyweight ? (
                    /* Bodyweight — just a label, no input */
                    <div style={{
                      flex: 1, height: '48px',
                      background: set.done ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)',
                      borderRadius: '12px',
                      border: `1px solid ${set.done ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: '500',
                      color: set.done ? '#22c55e' : 'rgba(255,255,255,0.25)',
                    }}>
                      Bodyweight
                    </div>
                  ) : isTime ? (
                    /* Time — single input with min suffix */
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={set.weight === '' ? '' : set.weight}
                        onChange={(e) => updateSet(idx, 'weight', e.target.value)}
                        placeholder={prevSet ? `${prevSet.weight}` : '0'}
                        style={{
                          width: '100%', height: '48px',
                          background: set.done ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${set.done ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)'}`,
                          borderRadius: '12px',
                          color: set.done ? '#22c55e' : '#eee',
                          fontSize: '16px', fontWeight: '600',
                          textAlign: 'center', outline: 'none', fontFamily: 'inherit',
                          paddingRight: '32px',
                          transition: 'border-color 0.2s ease',
                        }}
                      />
                      <span style={{
                        position: 'absolute', right: '12px', top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '11px', color: 'rgba(255,255,255,0.18)',
                      }}>min</span>
                    </div>
                  ) : (
                    /* Standard — weight with +/- and reps with +/- */
                    <div style={{ flex: 1, display: 'flex', gap: '6px' }}>
                      {/* Weight group */}
                      <div style={{
                        flex: 1, display: 'flex', alignItems: 'center',
                        background: set.done ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${set.done ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        transition: 'border-color 0.2s ease',
                      }}>
                        <button
                          onClick={() => adjustWeight(idx, -2.5)}
                          aria-label="Decrease weight"
                          style={{
                            width: '32px', height: '48px',
                            background: 'transparent',
                            border: 'none',
                            borderRight: `1px solid ${set.done ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)'}`,
                            color: 'rgba(255,255,255,0.3)', fontSize: '18px', fontWeight: '400',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >−</button>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={set.weight === '' ? '' : set.weight}
                          onChange={(e) => updateSet(idx, 'weight', e.target.value)}
                          placeholder={prevSet ? `${prevSet.weight}` : '0'}
                          style={{
                            flex: 1, minWidth: 0, width: '100%', height: '48px',
                            background: 'transparent',
                            border: 'none',
                            color: set.done ? '#22c55e' : '#eee',
                            fontSize: '16px', fontWeight: '700',
                            textAlign: 'center', outline: 'none',
                            fontFamily: 'inherit',
                          }}
                        />
                        <button
                          onClick={() => adjustWeight(idx, 2.5)}
                          aria-label="Increase weight"
                          style={{
                            width: '32px', height: '48px',
                            background: 'transparent',
                            border: 'none',
                            borderLeft: `1px solid ${set.done ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)'}`,
                            color: 'rgba(255,255,255,0.3)', fontSize: '18px', fontWeight: '400',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >+</button>
                      </div>

                      {/* Reps group */}
                      <div style={{
                        flex: 1, display: 'flex', alignItems: 'center',
                        background: set.done ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${set.done ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)'}`,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        transition: 'border-color 0.2s ease',
                      }}>
                        <button
                          onClick={() => adjustReps(idx, -1)}
                          aria-label="Decrease reps"
                          style={{
                            width: '32px', height: '48px',
                            background: 'transparent',
                            border: 'none',
                            borderRight: `1px solid ${set.done ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)'}`,
                            color: 'rgba(255,255,255,0.3)', fontSize: '18px', fontWeight: '400',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >−</button>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={set.reps === '' ? '' : set.reps}
                          onChange={(e) => updateSet(idx, 'reps', e.target.value)}
                          placeholder={prevSet ? `${prevSet.reps}` : '10'}
                          style={{
                            flex: 1, minWidth: 0, width: '100%', height: '48px',
                            background: 'transparent',
                            border: 'none',
                            color: set.done ? '#22c55e' : '#eee',
                            fontSize: '16px', fontWeight: '700',
                            textAlign: 'center', outline: 'none',
                            fontFamily: 'inherit',
                          }}
                        />
                        <button
                          onClick={() => adjustReps(idx, 1)}
                          aria-label="Increase reps"
                          style={{
                            width: '32px', height: '48px',
                            background: 'transparent',
                            border: 'none',
                            borderLeft: `1px solid ${set.done ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)'}`,
                            color: 'rgba(255,255,255,0.3)', fontSize: '18px', fontWeight: '400',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >+</button>
                      </div>
                    </div>
                  )}

                  {/* Done checkbox */}
                  <button
                    onClick={() => toggleSetDone(idx)}
                    aria-label={set.done ? 'Mark set as not done' : 'Mark set as done'}
                    style={{
                      width: '48px', height: '48px',
                      borderRadius: '14px',
                      border: set.done
                        ? '2px solid #22c55e'
                        : '2px solid rgba(255,255,255,0.08)',
                      background: set.done
                        ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                        : 'rgba(255,255,255,0.02)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0,
                      transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      boxShadow: set.done ? '0 0 16px rgba(34,197,94,0.2)' : 'none',
                    }}
                  >
                    {set.done && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                        className="animate-check-pop"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Column labels row — shown below sets as a legend */}
          {!isBodyweight && !isTime && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              marginTop: '4px', padding: '0 0 0 24px',
            }}>
              <div style={{
                flex: 1, textAlign: 'center',
                fontSize: '9px', color: 'rgba(255,255,255,0.12)',
                textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: '600',
              }}>KG</div>
              <div style={{
                flex: 1, textAlign: 'center',
                fontSize: '9px', color: 'rgba(255,255,255,0.12)',
                textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: '600',
              }}>REPS</div>
              <div style={{ width: '48px' }} />
            </div>
          )}

          {/* Previous session context */}
          {previousSets && previousSets.length > 0 && !isBodyweight && !isTime && (
            <div style={{
              fontSize: '11px', color: 'rgba(255,255,255,0.15)', marginTop: '10px',
              display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 0',
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
              </svg>
              <span>
                Prev: {previousSets.map((s) => `${s.weight}×${s.reps}`).slice(0, 3).join('  ')}
              </span>
            </div>
          )}

          {/* Add/Remove set */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button
              onClick={addSet}
              style={{
                flex: 1, height: '40px',
                background: 'transparent',
                border: '1px dashed rgba(255,255,255,0.06)',
                borderRadius: '12px',
                color: 'rgba(255,255,255,0.2)',
                fontSize: '12px', fontWeight: '600',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                fontFamily: 'inherit',
                transition: 'border-color 0.15s ease',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Set
            </button>
            {exercise.sets.length > 1 && (
              <button
                onClick={() => removeSet(exercise.sets.length - 1)}
                style={{
                  width: '40px', height: '40px',
                  background: 'transparent',
                  border: '1px dashed rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  color: 'rgba(255,255,255,0.2)',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'inherit',
                }}
              >
                −
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
