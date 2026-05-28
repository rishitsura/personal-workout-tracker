'use client'
import { useState } from 'react'
import BottomNav from '../../components/BottomNav'
import { WORKOUT_PLANS, DAY_ORDER } from '../../lib/workoutData'
import {
  getInsights, getCalendarHeatmap,
  getExerciseProgression, getPlateaus, getMuscleGroupBalance,
  getWeeklyVolumes, getMostImproved, getRecommendations,
} from '../../lib/storage'
import { useWorkout } from '../../lib/workoutContext'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// Stat card component
function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: '#0f0f0f', borderRadius: '14px', border: '1px solid #161616',
      padding: '16px', flex: 1, minWidth: 0,
    }}>
      <div style={{
        fontSize: '24px', fontWeight: '800', color: color || '#f0f0f0',
        fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em', lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', fontWeight: '600', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: '10px', color: '#3a3a3a', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

// Recommendation icon component
function RecIcon({ type }) {
  const iconMap = {
    fire: <path d="M12 12c-2-2.67-4-4-4-6a4 4 0 0 1 8 0c0 2-2 3.33-4 6zm0 0c1.33 1.78 2 3.17 2 4a2 2 0 0 1-4 0c0-.83.67-2.22 2-4z" />,
    alert: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
    trophy: <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6m12 5h1.5a2.5 2.5 0 0 0 0-5H18M9 22h6M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-0.85-3.25-2.03-3.79A1.09 1.09 0 0 1 14 17v-2.34m-4 0a6 6 0 1 1 4 0" />,
    trending: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>,
    chart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
    pause: <><circle cx="12" cy="12" r="10" /><line x1="10" y1="15" x2="10" y2="9" /><line x1="14" y1="15" x2="14" y2="9" /></>,
    scale: <><path d="M16 2v4" /><path d="M8 2v4" /><path d="m3 10 2.5 2.5L3 15" /><path d="m21 10-2.5 2.5L21 15" /><path d="M12 6v12" /><path d="M3 10h18" /></>,
    target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {iconMap[type] || iconMap.chart}
    </svg>
  )
}

export default function HistoryPage() {
  const { logs: contextLogs, profile, deleteLog: contextDeleteLog } = useWorkout()
  const [tab, setTab] = useState('log')
  const [expandedLog, setExpandedLog] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Derived state from context
  const logs = [...contextLogs].filter((log) => log.completed && !log.skipped).sort((a, b) => b.date.localeCompare(a.date))
  const insights = getInsights(contextLogs, profile)
  const heatmap = getCalendarHeatmap(contextLogs)
  const recommendations = getRecommendations(contextLogs, profile)
  const muscleBalance = getMuscleGroupBalance(contextLogs)
  const weeklyVols = getWeeklyVolumes(contextLogs)
  const mostImproved = getMostImproved(contextLogs)
  const plateaus = getPlateaus(contextLogs)

  function handleDelete(date) {
    contextDeleteLog(date)
    setDeleteConfirm(null)
    setExpandedLog(null)
  }

  const tabs = [
    { id: 'log', label: 'Log' },
    { id: 'insights', label: 'Insights' },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: '#050505' }} className="safe-bottom">
      {/* Header */}
      <div style={{ padding: '24px 20px 0', borderBottom: '1px solid #111' }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: '32px',
          letterSpacing: '0.06em', color: '#f0f0f0',
        }}>
          Iron Log
        </div>
        <div style={{ fontSize: '12px', color: '#4a4a4a', marginTop: '2px' }}>
          {logs.length} sessions logged
        </div>

        {/* Calendar heatmap */}
        {heatmap.length > 0 && (
          <div style={{ margin: '16px 0 0', overflowX: 'auto', paddingBottom: '4px' }}>
            <div style={{ display: 'flex', gap: '4px', minWidth: 'max-content' }}>
              {heatmap.map((day) => {
                const plan = day.dayKey ? WORKOUT_PLANS[day.dayKey] : null
                return (
                  <div
                    key={day.date}
                    title={`${formatDate(day.date)}${plan ? ` — ${plan.name}` : ''}`}
                    style={{
                      width: '28px', height: '28px', borderRadius: '6px',
                      background: plan ? `${plan.color}25` : day.isToday ? '#141414' : '#0a0a0a',
                      border: day.isToday ? '1px solid #2a2a2a' : plan ? `1px solid ${plan.color}15` : '1px solid transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '9px', fontWeight: '600',
                      color: plan ? plan.color : day.isToday ? '#555' : '#2a2a2a',
                      flexShrink: 0,
                    }}
                  >
                    {day.dayOfMonth}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tab toggle */}
        <div style={{ display: 'flex', marginTop: '16px', background: '#0a0a0a', borderRadius: '10px', padding: '3px' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, height: '36px', borderRadius: '8px',
                background: tab === t.id ? '#161616' : 'transparent',
                border: tab === t.id ? '1px solid #1e1e1e' : '1px solid transparent',
                color: tab === t.id ? '#f0f0f0' : '#4a4a4a',
                fontSize: '13px', fontWeight: tab === t.id ? '700' : '500',
                cursor: 'pointer', fontFamily: 'inherit',
                letterSpacing: '0.03em',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ height: '16px' }} />
      </div>

      {/* ====================================
          LOG TAB
          ==================================== */}
      {tab === 'log' && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {logs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#3a3a3a' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 16px', display: 'block' }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <div style={{ fontSize: '14px' }}>No workouts logged yet</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Start your first session from the Today tab</div>
            </div>
          )}
          {logs.map((log) => {
            const plan = WORKOUT_PLANS[log.dayKey]
            if (!plan) return null
            const isExpanded = expandedLog === log.date
            const totalSets = log.exercises?.reduce((a, e) => a + e.sets.length, 0) || 0
            const totalVolume = log.exercises?.reduce(
              (a, e) => a + e.sets.reduce((s, set) => s + ((set.weight || 0) * (set.reps || 0)), 0), 0
            ) || 0

            return (
              <div key={log.date} style={{
                background: '#0f0f0f', borderRadius: '16px',
                border: '1px solid #161616', overflow: 'hidden',
              }}>
                <button
                  onClick={() => setExpandedLog(isExpanded ? null : log.date)}
                  style={{
                    width: '100%', padding: '16px', background: 'none',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '14px', textAlign: 'left',
                    minHeight: '56px',
                  }}
                >
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: `${plan.color}10`, border: `1px solid ${plan.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: plan.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '14px', fontWeight: '700', color: '#ddd',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {plan.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#4a4a4a', marginTop: '2px' }}>
                      {formatDate(log.date)} · {totalSets} sets{totalVolume > 0 ? ` · ${Math.round(totalVolume).toLocaleString()}kg` : ''}
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3a3a3a"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="animate-fade-in" style={{ padding: '0 16px 16px', borderTop: '1px solid #161616' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '14px' }}>
                      {log.exercises?.map((ex, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <div style={{
                            width: '5px', height: '5px', borderRadius: '50%',
                            background: plan.color, marginTop: '7px', flexShrink: 0,
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#aaa', marginBottom: '4px' }}>
                              {ex.name}
                            </div>
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                              {ex.sets.filter((s) => s.done).map((s, si) => (
                                <span key={si} style={{
                                  fontSize: '11px', color: '#555',
                                  background: '#141414', borderRadius: '6px',
                                  padding: '3px 8px', border: '1px solid #1a1a1a',
                                }}>
                                  {ex.unit === 'bodyweight' ? 'BW' : `${s.weight}kg`} × {s.reps}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Delete */}
                    {deleteConfirm === log.date ? (
                      <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleDelete(log.date)}
                          style={{
                            flex: 1, height: '40px', background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px',
                            color: '#ef4444', fontSize: '13px', fontWeight: '600',
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          style={{
                            flex: 1, height: '40px', background: '#141414',
                            border: '1px solid #1e1e1e', borderRadius: '10px',
                            color: '#666', fontSize: '13px', fontWeight: '600',
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(log.date)}
                        style={{
                          marginTop: '14px', width: '100%', height: '36px',
                          background: 'transparent', border: '1px solid #1e1e1e',
                          borderRadius: '10px', color: '#3a3a3a', fontSize: '12px',
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Delete entry
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ====================================
          INSIGHTS TAB
          ==================================== */}
      {tab === 'insights' && insights && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <StatCard label="Sessions" value={insights.totalSessions} color="#f97316" />
            <StatCard label="Streak" value={`${insights.streak}d`} color="#22c55e" />
            <StatCard label="Volume" value={`${(insights.totalVolume / 1000).toFixed(1)}t`} sub="total lifted" color="#3b82f6" />
            <StatCard label="Consistency" value={`${insights.consistency}%`} sub={`${insights.daysSinceStart} days`} color="#8b5cf6" />
          </div>

          {/* Smart Recommendations */}
          {recommendations.length > 0 && (
            <div style={{
              background: '#0f0f0f', borderRadius: '16px',
              border: '1px solid #161616', padding: '18px',
            }}>
              <div style={{
                fontSize: '11px', color: '#4a4a4a', textTransform: 'uppercase',
                letterSpacing: '0.1em', marginBottom: '14px', fontWeight: '600',
              }}>
                Smart Insights
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recommendations.map((rec, i) => {
                  const colorMap = {
                    praise: '#22c55e', rest: '#f59e0b', plateau: '#ef4444',
                    balance: '#3b82f6', info: '#8a8a8a',
                  }
                  const c = colorMap[rec.type] || '#8a8a8a'
                  return (
                    <div key={i} style={{
                      display: 'flex', gap: '12px', alignItems: 'flex-start',
                      padding: '12px', background: '#0a0a0a', borderRadius: '12px',
                      border: '1px solid #141414',
                    }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: `${c}12`, border: `1px solid ${c}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: c, flexShrink: 0,
                      }}>
                        <RecIcon type={rec.icon} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#ddd', marginBottom: '2px' }}>
                          {rec.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.5 }}>
                          {rec.text}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Volume per session chart */}
          {insights.volumeChart.length > 0 && (
            <div style={{
              background: '#0f0f0f', borderRadius: '16px',
              border: '1px solid #161616', padding: '18px',
            }}>
              <div style={{
                fontSize: '11px', color: '#4a4a4a', textTransform: 'uppercase',
                letterSpacing: '0.1em', marginBottom: '16px', fontWeight: '600',
              }}>
                Volume Per Session
              </div>
              {(() => {
                const maxVol = Math.max(...insights.volumeChart.map((v) => v.volume), 1)
                return (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px' }}>
                    {insights.volumeChart.map((v, i) => {
                      const plan = WORKOUT_PLANS[v.dayKey]
                      const h = Math.max(4, (v.volume / maxVol) * 100)
                      return (
                        <div key={i} style={{
                          flex: 1, display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: '4px',
                        }}>
                          <div style={{
                            fontSize: '8px', color: '#3a3a3a', whiteSpace: 'nowrap',
                            transform: 'rotate(-45deg)', transformOrigin: 'center',
                          }}>
                            {v.volume > 0 ? Math.round(v.volume) : ''}
                          </div>
                          <div style={{
                            width: '100%', maxWidth: '24px', height: `${h}%`,
                            background: plan ? `${plan.color}60` : '#333',
                            borderRadius: '4px 4px 2px 2px',
                            transition: 'height 0.5s ease',
                            minHeight: '4px',
                          }} />
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          )}

          {/* Muscle Group Balance */}
          {Object.keys(muscleBalance).length > 0 && (
            <div style={{
              background: '#0f0f0f', borderRadius: '16px',
              border: '1px solid #161616', padding: '18px',
            }}>
              <div style={{
                fontSize: '11px', color: '#4a4a4a', textTransform: 'uppercase',
                letterSpacing: '0.1em', marginBottom: '14px', fontWeight: '600',
              }}>
                Muscle Group Balance
              </div>
              {(() => {
                const maxVol = Math.max(...Object.values(muscleBalance), 1)
                const colorMap = {
                  Chest: '#f97316', Back: '#3b82f6', Shoulders: '#10b981',
                  Legs: '#8b5cf6', Biceps: '#06b6d4', Triceps: '#ec4899',
                }
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.entries(muscleBalance)
                      .sort((a, b) => b[1] - a[1])
                      .map(([group, vol]) => (
                        <div key={group}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', color: '#8a8a8a', fontWeight: 500 }}>{group}</span>
                            <span style={{ fontSize: '11px', color: '#4a4a4a' }}>{Math.round(vol).toLocaleString()}kg</span>
                          </div>
                          <div style={{ height: '6px', background: '#141414', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', width: `${(vol / maxVol) * 100}%`,
                              background: colorMap[group] || '#555',
                              borderRadius: '3px', transition: 'width 0.5s ease',
                            }} />
                          </div>
                        </div>
                      ))}
                  </div>
                )
              })()}
            </div>
          )}

          {/* Most Improved Exercises */}
          {mostImproved.length > 0 && (
            <div style={{
              background: '#0f0f0f', borderRadius: '16px',
              border: '1px solid #161616', padding: '18px',
            }}>
              <div style={{
                fontSize: '11px', color: '#4a4a4a', textTransform: 'uppercase',
                letterSpacing: '0.1em', marginBottom: '14px', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
                </svg>
                Most Improved
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mostImproved.slice(0, 5).map((ex, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: i < Math.min(mostImproved.length, 5) - 1 ? '1px solid #141414' : 'none',
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#bbb' }}>{ex.name}</div>
                      <div style={{ fontSize: '11px', color: '#4a4a4a', marginTop: '2px' }}>
                        {ex.from}kg → {ex.to}kg
                      </div>
                    </div>
                    <div style={{
                      fontSize: '14px', fontWeight: '800', color: '#22c55e',
                      fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em',
                      display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      +{ex.improvement}kg
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plateau Warnings */}
          {plateaus.length > 0 && (
            <div style={{
              background: '#0f0f0f', borderRadius: '16px',
              border: '1px solid rgba(239,68,68,0.15)', padding: '18px',
            }}>
              <div style={{
                fontSize: '11px', color: '#ef4444', textTransform: 'uppercase',
                letterSpacing: '0.1em', marginBottom: '14px', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z" />
                </svg>
                Plateau Alert
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {plateaus.map((p, i) => (
                  <div key={i} style={{
                    padding: '10px 12px', background: 'rgba(239,68,68,0.04)',
                    borderRadius: '10px', border: '1px solid rgba(239,68,68,0.08)',
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#ddd' }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                      Stuck at {p.weight}kg for {p.sessions}+ sessions. Try adding 1-2.5kg.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personal Records */}
          {insights.prs && Object.keys(insights.prs).length > 0 && (
            <div style={{
              background: '#0f0f0f', borderRadius: '16px',
              border: '1px solid #161616', padding: '18px',
            }}>
              <div style={{
                fontSize: '11px', color: '#4a4a4a', textTransform: 'uppercase',
                letterSpacing: '0.1em', marginBottom: '14px', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Personal Records
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.values(insights.prs)
                  .sort((a, b) => b.weight - a.weight)
                  .slice(0, 8)
                  .map((pr, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: i < 7 ? '1px solid #141414' : 'none',
                    }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#bbb' }}>{pr.name}</div>
                        <div style={{ fontSize: '10px', color: '#3a3a3a', marginTop: '1px' }}>{formatDate(pr.date)}</div>
                      </div>
                      <div style={{
                        fontSize: '18px', fontWeight: '800', color: '#f97316',
                        fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em',
                      }}>
                        {pr.weight} kg
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Day Split */}
          {Object.keys(insights.dayBreakdown).length > 0 && (
            <div style={{
              background: '#0f0f0f', borderRadius: '16px',
              border: '1px solid #161616', padding: '18px',
            }}>
              <div style={{
                fontSize: '11px', color: '#4a4a4a', textTransform: 'uppercase',
                letterSpacing: '0.1em', marginBottom: '14px', fontWeight: '600',
              }}>
                Training Split
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(insights.dayBreakdown).map(([key, count]) => {
                  const plan = WORKOUT_PLANS[key]
                  if (!plan) return null
                  const maxCount = Math.max(...Object.values(insights.dayBreakdown))
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: `${plan.color}12`, border: `1px solid ${plan.color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: plan.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', color: '#8a8a8a' }}>{plan.name}</span>
                          <span style={{ fontSize: '11px', color: '#4a4a4a' }}>{count}×</span>
                        </div>
                        <div style={{ height: '4px', background: '#141414', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${(count / maxCount) * 100}%`,
                            background: plan.color, borderRadius: '2px',
                            transition: 'width 0.4s ease',
                          }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
