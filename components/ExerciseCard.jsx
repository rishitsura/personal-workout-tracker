'use client'
import { useState } from 'react'

export default function ExerciseCard({ exercise, dayColor, onChange, previousSets }) {
  const [expanded, setExpanded] = useState(true)

  const allDone = exercise.sets.every((s) => s.done)
  const someDone = exercise.sets.some((s) => s.done)

  function updateSet(idx, field, value) {
    const updated = exercise.sets.map((s, i) =>
      i === idx ? { ...s, [field]: field === 'done' ? value : value === '' ? '' : parseFloat(value) || 0 } : s
    )
    onChange({ ...exercise, sets: updated })
  }

  function toggleSetDone(idx) {
    updateSet(idx, 'done', !exercise.sets[idx].done)
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

  return (
    <div
      style={{
        background: '#111111',
        borderRadius: '16px',
        border: allDone ? `1px solid rgba(34,197,94,0.3)` : `1px solid #1e1e1e`,
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '14px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          gap: '12px',
          textAlign: 'left',
        }}
      >
        {/* Status dot */}
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: allDone ? '#22c55e' : someDone ? dayColor : '#333',
            flexShrink: 0,
            transition: 'background 0.2s ease',
            boxShadow: allDone ? '0 0 6px rgba(34,197,94,0.5)' : 'none',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: allDone ? '#888' : '#f5f5f5',
              textDecoration: allDone ? 'line-through' : 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {exercise.name}
          </div>
          <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
            {exercise.sets.filter((s) => s.done).length}/{exercise.sets.length} sets done
          </div>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Sets */}
      {expanded && (
        <div style={{ padding: '0 16px 14px' }}>
          {/* Column headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr 1fr 36px',
              gap: '8px',
              marginBottom: '8px',
              padding: '0 2px',
            }}
          >
            <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>#</div>
            {isBodyweight ? (
              <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em', gridColumn: '2 / 4' }}>Reps</div>
            ) : isTime ? (
              <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em', gridColumn: '2 / 4' }}>Minutes</div>
            ) : (
              <>
                <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>kg</div>
                <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>reps</div>
              </>
            )}
            <div style={{ fontSize: '10px', color: '#444' }}></div>
          </div>

          {exercise.sets.map((set, idx) => {
            const prevSet = previousSets?.[idx]
            return (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '28px 1fr 1fr 36px',
                  gap: '8px',
                  marginBottom: '8px',
                  alignItems: 'center',
                }}
              >
                {/* Set number */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: set.done ? 'rgba(34,197,94,0.15)' : '#1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: set.done ? '#22c55e' : '#555',
                    flexShrink: 0,
                  }}
                >
                  {idx + 1}
                </div>

                {/* Weight or bodyweight */}
                {isBodyweight ? (
                  <div
                    style={{
                      gridColumn: '2 / 4',
                      height: '40px',
                      background: set.done ? 'rgba(34,197,94,0.08)' : '#1a1a1a',
                      borderRadius: '10px',
                      border: `1px solid ${set.done ? 'rgba(34,197,94,0.2)' : '#222'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      color: set.done ? '#22c55e' : '#666',
                    }}
                  >
                    Bodyweight
                  </div>
                ) : isTime ? (
                  <div style={{ gridColumn: '2 / 4' }}>
                    <input
                      type="number"
                      value={set.weight === '' ? '' : set.weight}
                      onChange={(e) => updateSet(idx, 'weight', e.target.value)}
                      placeholder={prevSet ? `${prevSet.weight}` : '0'}
                      style={{
                        width: '100%',
                        height: '40px',
                        background: set.done ? 'rgba(34,197,94,0.08)' : '#1a1a1a',
                        border: `1px solid ${set.done ? 'rgba(34,197,94,0.2)' : '#222'}`,
                        borderRadius: '10px',
                        color: set.done ? '#22c55e' : '#f5f5f5',
                        fontSize: '15px',
                        fontWeight: '600',
                        textAlign: 'center',
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <input
                      type="number"
                      value={set.weight === '' ? '' : set.weight}
                      onChange={(e) => updateSet(idx, 'weight', e.target.value)}
                      placeholder={prevSet ? `${prevSet.weight}` : '0'}
                      style={{
                        width: '100%',
                        height: '40px',
                        background: set.done ? 'rgba(34,197,94,0.08)' : '#1a1a1a',
                        border: `1px solid ${set.done ? 'rgba(34,197,94,0.2)' : '#222'}`,
                        borderRadius: '10px',
                        color: set.done ? '#22c55e' : '#f5f5f5',
                        fontSize: '15px',
                        fontWeight: '600',
                        textAlign: 'center',
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                    <input
                      type="number"
                      value={set.reps === '' ? '' : set.reps}
                      onChange={(e) => updateSet(idx, 'reps', e.target.value)}
                      placeholder={prevSet ? `${prevSet.reps}` : '10'}
                      style={{
                        width: '100%',
                        height: '40px',
                        background: set.done ? 'rgba(34,197,94,0.08)' : '#1a1a1a',
                        border: `1px solid ${set.done ? 'rgba(34,197,94,0.2)' : '#222'}`,
                        borderRadius: '10px',
                        color: set.done ? '#22c55e' : '#f5f5f5',
                        fontSize: '15px',
                        fontWeight: '600',
                        textAlign: 'center',
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  </>
                )}

                {/* Done toggle */}
                <button
                  onClick={() => toggleSetDone(idx)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    border: `2px solid ${set.done ? '#22c55e' : '#333'}`,
                    background: set.done ? '#22c55e' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {set.done && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </div>
            )
          })}

          {/* Previous best hint */}
          {previousSets && previousSets.length > 0 && !isBodyweight && (
            <div style={{ fontSize: '10px', color: '#444', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>📋</span>
              <span>
                Last: {previousSets[0]?.weight}kg × {previousSets[0]?.reps}
                {previousSets.length > 1 && `, ${previousSets[1]?.weight}kg × ${previousSets[1]?.reps}`}
              </span>
            </div>
          )}

          {/* Add/Remove set */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={addSet}
              style={{
                flex: 1,
                height: '32px',
                background: 'transparent',
                border: '1px dashed #333',
                borderRadius: '8px',
                color: '#555',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> Add Set
            </button>
            {exercise.sets.length > 1 && (
              <button
                onClick={() => removeSet(exercise.sets.length - 1)}
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'transparent',
                  border: '1px dashed #333',
                  borderRadius: '8px',
                  color: '#555',
                  fontSize: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
