'use client'
import { useState, useEffect } from 'react'
import BottomNav from '../../components/BottomNav'
import { WORKOUT_PLANS } from '../../lib/workoutData'
import { getLogs, getInsights, deleteLog } from '../../lib/storage'

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: '#111', borderRadius: '14px', border: '1px solid #1e1e1e', padding: '14px 16px', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '22px', fontWeight: '800', color: accent || '#f5f5f5', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em' }}>{value}</div>
      <div style={{ fontSize: '11px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      {sub && <div style={{ fontSize: '10px', color: '#444', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}

function MiniBar({ value, max, color }) {
  return (
    <div style={{ flex: 1, height: '4px', background: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: '2px', transition: 'width 0.4s ease' }} />
    </div>
  )
}

export default function HistoryPage() {
  const [logs, setLogs] = useState([])
  const [insights, setInsights] = useState(null)
  const [tab, setTab] = useState('history') // 'history' | 'insights'
  const [expandedLog, setExpandedLog] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    const l = getLogs().filter((log) => log.completed).sort((a, b) => b.date.localeCompare(a.date))
    setLogs(l)
    setInsights(getInsights())
  }, [])

  function handleDelete(date) {
    deleteLog(date)
    const l = getLogs().filter((log) => log.completed).sort((a, b) => b.date.localeCompare(a.date))
    setLogs(l)
    setInsights(getInsights())
    setDeleteConfirm(null)
    setExpandedLog(null)
  }

  const prList = insights ? Object.values(insights.prs).sort((a, b) => b.weight - a.weight).slice(0, 8) : []

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: '90px' }}>
      {/* Header */}
      <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #111' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '32px', letterSpacing: '0.06em', color: '#f5f5f5' }}>
          Iron Log
        </div>
        <div style={{ fontSize: '12px', color: '#555', marginTop: '2px' }}>
          {logs.length} sessions logged since May 15
        </div>

        {/* Tab toggle */}
        <div style={{ display: 'flex', marginTop: '16px', background: '#111', borderRadius: '10px', padding: '3px' }}>
          {['history', 'insights'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, height: '34px', borderRadius: '8px',
                background: tab === t ? '#1e1e1e' : 'transparent',
                border: tab === t ? '1px solid #2a2a2a' : '1px solid transparent',
                color: tab === t ? '#f5f5f5' : '#555',
                fontSize: '12px', fontWeight: tab === t ? '700' : '400',
                cursor: 'pointer', fontFamily: 'inherit',
                textTransform: 'capitalize', letterSpacing: '0.04em',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* History tab */}
      {tab === 'history' && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {logs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#444' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
              <div style={{ fontSize: '14px' }}>No workouts logged yet</div>
            </div>
          )}
          {logs.map((log) => {
            const plan = WORKOUT_PLANS[log.dayKey]
            const isExpanded = expandedLog === log.date
            const totalSets = log.exercises?.reduce((a, e) => a + e.sets.length, 0) || 0
            const totalVolume = log.exercises?.reduce((a, e) => a + e.sets.reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0), 0) || 0

            return (
              <div key={log.date} style={{ background: '#111', borderRadius: '16px', border: '1px solid #1e1e1e', overflow: 'hidden' }}>
                {/* Log header */}
                <button
                  onClick={() => setExpandedLog(isExpanded ? null : log.date)}
                  style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}
                >
                  <div
                    style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${plan.color}15`, border: `1px solid ${plan.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}
                  >
                    {plan.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#ddd', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {plan.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#555', marginTop: '1px' }}>
                      {formatDate(log.date)} · {totalSets} sets · {totalVolume > 0 ? `${Math.round(totalVolume).toLocaleString()}kg vol` : 'BW'}
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ padding: '0 16px 14px', borderTop: '1px solid #1a1a1a' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px' }}>
                      {log.exercises?.map((ex, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: plan.color, marginTop: '7px', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#bbb', marginBottom: '3px' }}>{ex.name}</div>
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                              {ex.sets.map((s, si) => (
                                <span key={si} style={{ fontSize: '10px', color: '#666', background: '#1a1a1a', borderRadius: '5px', padding: '2px 7px' }}>
                                  {ex.unit === 'bodyweight' ? `BW` : `${s.weight}kg`} × {s.reps}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Delete button */}
                    {deleteConfirm === log.date ? (
                      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleDelete(log.date)}
                          style={{ flex: 1, height: '36px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          style={{ flex: 1, height: '36px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#888', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(log.date)}
                        style={{ marginTop: '12px', width: '100%', height: '32px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#444', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}
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

      {/* Insights tab */}
      {tab === 'insights' && insights && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Stats row */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <StatCard label="Sessions" value={insights.totalSessions} sub={`since May 15`} accent="#f97316" />
            <StatCard label="Streak" value={`${insights.streak}d`} sub={`current`} accent="#22c55e" />
            <StatCard label="Volume" value={`${Math.round(insights.totalVolume / 1000)}t`} sub={`total lifted`} accent="#3b82f6" />
          </div>

          {/* Volume chart (simple bars) */}
          {insights.volumeChart.length > 0 && (
            <div style={{ background: '#111', borderRadius: '16px', border: '1px solid #1e1e1e', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px', fontWeight: '600' }}>
                Volume Per Session (last {insights.volumeChart.length})
              </div>
              {(() => {
                const maxVol = Math.max(...insights.volumeChart.map((v) => v.volume), 1)
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {insights.volumeChart.map((v, i) => {
                      const log = logs.find((l) => l.date === v.date)
                      const plan = log ? WORKOUT_PLANS[log.dayKey] : null
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ fontSize: '10px', color: '#555', width: '48px', flexShrink: 0 }}>
                            {formatDate(v.date).split(',')[0]}
                          </div>
                          <div style={{ flex: 1, height: '6px', background: '#1a1a1a', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(v.volume / maxVol) * 100}%`, background: plan?.color || '#f97316', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                          </div>
                          <div style={{ fontSize: '10px', color: '#555', width: '52px', textAlign: 'right', flexShrink: 0 }}>
                            {v.volume > 0 ? `${Math.round(v.volume).toLocaleString()}` : 'BW'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          )}

          {/* Day split */}
          <div style={{ background: '#111', borderRadius: '16px', border: '1px solid #1e1e1e', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px', fontWeight: '600' }}>
              Day Split Breakdown
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Object.entries(insights.dayBreakdown).map(([key, count]) => {
                const plan = WORKOUT_PLANS[key]
                const maxCount = Math.max(...Object.values(insights.dayBreakdown))
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px', width: '20px' }}>{plan.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#888' }}>{plan.name}</span>
                        <span style={{ fontSize: '11px', color: '#555' }}>{count}×</span>
                      </div>
                      <MiniBar value={count} max={maxCount} color={plan.color} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* PRs */}
          {prList.length > 0 && (
            <div style={{ background: '#111', borderRadius: '16px', border: '1px solid #1e1e1e', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px', fontWeight: '600' }}>
                🏆 Personal Records
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {prList.map((pr, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < prList.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#ddd' }}>{pr.name}</div>
                      <div style={{ fontSize: '10px', color: '#444', marginTop: '1px' }}>{formatDate(pr.date)}</div>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#f97316', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em' }}>
                      {pr.weight} kg
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
