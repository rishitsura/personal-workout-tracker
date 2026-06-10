'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Minus, Check } from 'lucide-react'

export default function ExerciseCard({
  exercise,
  index,
  previousSessionExercise,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  const sets = exercise.sets || []
  const totalSets = sets.length
  const completedSets = sets.filter(s => s.done).length

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden mb-3">
      {/* Header (always visible) */}
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-card-secondary transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-border-strong flex items-center justify-center text-xs font-semibold text-txt-secondary">
            {index + 1}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-txt-primary">{exercise.name}</h3>
            <p className="text-xs text-txt-muted mt-0.5">
              {completedSets} / {totalSets} sets completed
            </p>
          </div>
        </div>
        <div className="text-txt-muted">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {/* Expanded Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 pt-0 border-t border-border-subtle">
          
          {/* Column Headers */}
          <div className="flex items-center text-[10px] font-semibold text-txt-muted uppercase tracking-wider mb-2 px-2">
            <div className="w-8 text-center">Set</div>
            <div className="flex-1 text-center">Previous</div>
            <div className="flex-1 text-center">kg</div>
            <div className="flex-1 text-center">Reps</div>
            <div className="w-10 text-center">Done</div>
          </div>

          {/* Sets List */}
          <div className="space-y-2">
            {sets.map((set, setIdx) => {
              const prevSet = previousSessionExercise?.sets?.[setIdx]
              const prevText = prevSet ? `${prevSet.weight} × ${prevSet.reps}` : '—'
              const isDone = set.done

              return (
                <div
                  key={setIdx}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors duration-200
                    ${isDone ? 'bg-success/5' : 'bg-transparent'}
                  `}
                >
                  {/* Set Number */}
                  <div className="w-8 text-center text-xs font-semibold text-txt-secondary">
                    {setIdx + 1}
                  </div>

                  {/* Previous */}
                  <div className="flex-1 text-center text-xs text-txt-muted font-mono truncate">
                    {prevText}
                  </div>

                  {/* Weight Input */}
                  <div className="flex-1">
                    <input
                      type="number"
                      value={set.weight || ''}
                      onChange={(e) => onUpdateSet(exercise.id, setIdx, 'weight', e.target.value)}
                      placeholder={prevSet?.weight || exercise.defaultSets}
                      disabled={isDone}
                      className={`w-full bg-card-secondary border rounded-lg py-2 text-center text-sm font-mono transition-colors
                        ${isDone
                          ? 'border-transparent text-txt-muted opacity-60'
                          : 'border-border text-txt-primary focus:border-accent focus:bg-card placeholder:text-txt-faint'
                        }`}
                      style={{ minWidth: 0 }}
                    />
                  </div>

                  {/* Reps Input */}
                  <div className="flex-1">
                    <input
                      type="number"
                      value={set.reps || ''}
                      onChange={(e) => onUpdateSet(exercise.id, setIdx, 'reps', e.target.value)}
                      placeholder={prevSet?.reps || exercise.defaultReps}
                      disabled={isDone}
                      className={`w-full bg-card-secondary border rounded-lg py-2 text-center text-sm font-mono transition-colors
                        ${isDone
                          ? 'border-transparent text-txt-muted opacity-60'
                          : 'border-border text-txt-primary focus:border-accent focus:bg-card placeholder:text-txt-faint'
                        }`}
                      style={{ minWidth: 0 }}
                    />
                  </div>

                  {/* Done Toggle */}
                  <div className="w-10 flex justify-center flex-shrink-0">
                    <button
                      onClick={() => onUpdateSet(exercise.id, setIdx, 'done', !isDone)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
                        ${isDone
                          ? 'bg-success text-root shadow-sm shadow-success/20 animate-check-pop'
                          : 'bg-card-secondary border border-border text-txt-muted hover:border-success/50 hover:text-success'
                        }`}
                    >
                      <Check className="w-5 h-5" strokeWidth={isDone ? 3 : 2} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border-subtle">
            <button
              onClick={() => onRemoveSet(exercise.id)}
              disabled={sets.length <= 1}
              className="text-xs font-semibold text-txt-muted flex items-center gap-1 hover:text-danger disabled:opacity-30 disabled:hover:text-txt-muted transition-colors"
            >
              <Minus className="w-3.5 h-3.5" /> Drop Set
            </button>
            <button
              onClick={() => onAddSet(exercise.id)}
              className="text-xs font-semibold text-accent flex items-center gap-1 hover:text-accent-light transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Set
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
