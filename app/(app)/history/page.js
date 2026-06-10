'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../../lib/authContext'
import { subscribeToSessions, deleteSession, getProfile } from '../../../lib/firestoreService'
import { formatDateShort, calculateSessionVolume, calculateStreak } from '../../../lib/utils'
import { getDayEmoji, getDayColor } from '../../../lib/workoutData'

import { VolumeBarChart, DaySplitBars } from '../../../components/InsightCharts'
import MarkdownRenderer from '../../../components/MarkdownRenderer'
import BottomSheet from '../../../components/BottomSheet'
import { Flame, Calendar, Trash2, Zap, Target, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react'

export default function HistoryPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('history') // 'history' | 'insights'
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  
  // UI State
  const [expandedSessionId, setExpandedSessionId] = useState(null)
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null)

  // AI Insights State
  const [aiInsights, setAiInsights] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)

  // Subscribe to all sessions
  useEffect(() => {
    if (!user) return
    const unsub = subscribeToSessions(user.uid, (data) => {
      // Filter out incomplete active sessions, keep only completed ones
      setSessions(data.filter(s => s.completed))
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  const handleDelete = async () => {
    if (!user || !deleteConfirmTarget) return
    try {
      await deleteSession(user.uid, deleteConfirmTarget)
      setDeleteConfirmTarget(null)
      if (expandedSessionId === deleteConfirmTarget) {
        setExpandedSessionId(null)
      }
    } catch (err) {
      console.error('Error deleting session:', err)
      alert('Failed to delete session')
    }
  }


  // ========================================
  // AI INSIGHTS
  // ========================================
  const handleGenerateInsights = async () => {
    if (!user || sessions.length === 0) return
    
    setAiLoading(true)
    setAiError(null)
    setAiInsights(null)

    try {
      // Fetch profile for context
      const profile = await getProfile(user.uid)

      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions, profile }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error (${res.status})`)
      }

      const data = await res.json()
      setAiInsights(data.insights)
    } catch (err) {
      console.error('AI insights error:', err)
      setAiError(err.message || 'Failed to generate insights')
    } finally {
      setAiLoading(false)
    }
  }


  // ========================================
  // INSIGHTS CALCULATIONS
  // ========================================
  const stats = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return { totalSessions: 0, streak: 0, totalVolume: 0, prs: [] }
    }

    let totalVolume = 0
    const prMap = {} // { exId: { name, weight, date } }

    sessions.forEach(s => {
      s.exercises?.forEach(ex => {
        let maxWeightForEx = 0
        ex.sets?.forEach(set => {
          if (set.done) {
            const w = parseFloat(set.weight) || 0
            const r = parseInt(set.reps) || 0
            totalVolume += (w * r)
            if (w > maxWeightForEx) maxWeightForEx = w
          }
        })
        
        // Track PR
        if (maxWeightForEx > 0) {
          if (!prMap[ex.id] || maxWeightForEx > prMap[ex.id].weight) {
            prMap[ex.id] = {
              name: ex.name,
              weight: maxWeightForEx,
              date: s.date
            }
          }
        }
      })
    })

    const streak = calculateStreak(sessions)
    
    // Sort PRs by weight descending
    const prs = Object.values(prMap).sort((a, b) => b.weight - a.weight).slice(0, 5)

    return { totalSessions: sessions.length, streak, totalVolume, prs }
  }, [sessions])


  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin-slow" />
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 pb-10">
      
      {/* Header & Tabs */}
      <div className="sticky top-0 z-40 bg-root/95 backdrop-blur-md pt-12 pb-4 px-6 border-b border-border-subtle">
        <h1 className="font-display text-4xl tracking-wider text-txt-primary mb-6">ACTIVITY</h1>
        
        <div className="flex bg-card-secondary p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all
              ${activeTab === 'history' ? 'bg-card text-txt-primary shadow-sm' : 'text-txt-muted hover:text-txt-secondary'}`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all
              ${activeTab === 'insights' ? 'bg-card text-txt-primary shadow-sm' : 'text-txt-muted hover:text-txt-secondary'}`}
          >
            Insights
          </button>
        </div>
      </div>

      <div className="px-4 py-6">
        
        {/* ======================================== */}
        {/* TAB: HISTORY                             */}
        {/* ======================================== */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="text-center py-20 animate-fade-in">
                <Calendar className="w-12 h-12 text-txt-muted mx-auto mb-4 opacity-50" />
                <h3 className="text-txt-secondary font-medium">No workouts logged yet</h3>
                <p className="text-txt-muted text-sm mt-1">Complete a session to see it here</p>
              </div>
            ) : (
              <div className="stagger-children">
                {/* Reverse chronological */}
                {[...sessions].reverse().map(session => {
                  const isExpanded = expandedSessionId === session.id
                  const vol = calculateSessionVolume(session.exercises)
                  let totalSets = 0
                  session.exercises?.forEach(ex => {
                    ex.sets?.forEach(s => { if(s.done) totalSets++ })
                  })
                  const color = getDayColor(session.dayKey)

                  return (
                    <div key={session.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                      
                      {/* Summary Row (Clickable) */}
                      <button 
                        onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                        className="w-full p-4 flex items-center text-left hover:bg-card-secondary transition-colors"
                      >
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-card-secondary shrink-0">
                          {getDayEmoji(session.dayKey)}
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-base font-semibold text-txt-primary mb-0.5">{session.dayName}</h3>
                          <div className="flex items-center gap-2 text-xs font-medium">
                            <span style={{ color }}>{session.dayLabel}</span>
                            <span className="text-txt-muted">·</span>
                            <span className="text-txt-secondary">{formatDateShort(session.date)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-txt-primary">{vol.toLocaleString()} <span className="text-[10px] text-txt-muted uppercase font-normal">kg</span></div>
                          <div className="text-xs text-txt-secondary">{totalSets} sets</div>
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="p-4 pt-0 border-t border-border-subtle bg-card-secondary/30 animate-slide-down">
                          <div className="mt-4 space-y-4">
                            {session.exercises?.map((ex, i) => {
                              const doneSets = ex.sets?.filter(s => s.done) || []
                              if (doneSets.length === 0) return null
                              
                              return (
                                <div key={i}>
                                  <h4 className="text-sm font-medium text-txt-primary mb-2">{ex.name}</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {doneSets.map((s, j) => (
                                      <div key={j} className="bg-card border border-border rounded-md px-2 py-1 text-xs font-mono text-txt-secondary">
                                        <span className="text-txt-primary">{s.weight}</span>kg × <span className="text-txt-primary">{s.reps}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          
                          <div className="mt-6 pt-4 border-t border-border-subtle flex justify-end">
                            <button
                              onClick={() => setDeleteConfirmTarget(session.date)}
                              className="text-xs font-semibold text-danger flex items-center gap-1 hover:text-red-400 transition-colors bg-danger/10 px-3 py-1.5 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete Session
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}


        {/* ======================================== */}
        {/* TAB: INSIGHTS                            */}
        {/* ======================================== */}
        {activeTab === 'insights' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-2 text-txt-secondary">
                  <Calendar className="w-4 h-4 text-info" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Sessions</span>
                </div>
                <div className="text-3xl font-display tracking-wider text-txt-primary">{stats.totalSessions}</div>
              </div>
              
              <div className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-2 text-txt-secondary">
                  <Flame className="w-4 h-4 text-accent" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Streak</span>
                </div>
                <div className="text-3xl font-display tracking-wider text-txt-primary">
                  {stats.streak} <span className="text-base text-txt-muted font-sans uppercase tracking-normal">days</span>
                </div>
              </div>
              
              <div className="col-span-2 bg-gradient-to-br from-card to-card-secondary rounded-2xl p-4 border border-border shadow-inner">
                <div className="flex items-center gap-2 mb-2 text-txt-secondary">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Volume Lifted</span>
                </div>
                <div className="text-4xl font-display tracking-wider text-txt-primary">
                  {stats.totalVolume.toLocaleString()} <span className="text-lg text-txt-muted font-sans uppercase tracking-normal">kg</span>
                </div>
              </div>
            </div>

            {/* Volume Chart */}
            <div className="bg-card rounded-2xl p-5 border border-border">
              <h3 className="text-sm font-semibold text-txt-primary mb-4">Volume per Session</h3>
              <VolumeBarChart sessions={sessions} />
            </div>

            {/* Day Split */}
            <div className="bg-card rounded-2xl p-5 border border-border">
              <h3 className="text-sm font-semibold text-txt-primary mb-4">Day Split Frequency</h3>
              <DaySplitBars sessions={sessions} />
            </div>

            {/* PRs Board */}
            {stats.prs.length > 0 && (
              <div className="bg-card rounded-2xl p-5 border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-success" />
                  <h3 className="text-sm font-semibold text-txt-primary">Heaviest Lifts</h3>
                </div>
                
                <div className="space-y-3">
                  {stats.prs.map((pr, idx) => (
                    <div key={idx} className="flex items-center justify-between border-b border-border-subtle last:border-0 pb-2 last:pb-0">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-sm font-medium text-txt-primary truncate">{pr.name}</p>
                        <p className="text-xs text-txt-muted">{formatDateShort(pr.date)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-lg font-display tracking-wider text-success">{pr.weight}</span>
                        <span className="text-[10px] text-txt-muted ml-1 uppercase">kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* ======================================== */}
            {/* AI INSIGHTS PANEL                        */}
            {/* ======================================== */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-border-subtle bg-gradient-to-r from-accent/5 to-transparent">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-txt-primary">AI Workout Analysis</h3>
                    <p className="text-[11px] text-txt-muted">Powered by Gemma · Analyzes your last 20 sessions</p>
                  </div>
                </div>
              </div>

              <div className="p-5">
                {/* No sessions state */}
                {sessions.length === 0 && !aiLoading && !aiInsights && (
                  <div className="text-center py-6">
                    <p className="text-sm text-txt-muted">Log some workouts first to get personalized insights.</p>
                  </div>
                )}

                {/* CTA Button */}
                {sessions.length > 0 && !aiLoading && !aiInsights && !aiError && (
                  <button
                    onClick={handleGenerateInsights}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-accent to-amber-500 text-root font-bold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-accent/20 hover:shadow-accent/30 active:scale-[0.98] transition-all duration-200"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generate Workout Insights
                  </button>
                )}

                {/* Loading State */}
                {aiLoading && (
                  <div className="space-y-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin-slow" />
                      <span className="text-sm text-txt-secondary font-medium">Analyzing your workout data...</span>
                    </div>
                    {/* Skeleton lines */}
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-card-secondary rounded-md w-2/3" />
                        <div className="h-3 bg-card-secondary rounded-md w-full" />
                        <div className="h-3 bg-card-secondary rounded-md w-5/6" />
                        {i < 4 && <div className="h-px bg-border-subtle mt-3" />}
                      </div>
                    ))}
                  </div>
                )}

                {/* Error State */}
                {aiError && !aiLoading && (
                  <div className="animate-fade-in">
                    <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-danger mb-1">Failed to generate insights</p>
                        <p className="text-xs text-txt-muted">{aiError}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateInsights}
                      className="w-full py-3 rounded-xl bg-card-secondary border border-border text-txt-primary font-semibold text-sm flex items-center justify-center gap-2 hover:bg-card transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" /> Try Again
                    </button>
                  </div>
                )}

                {/* Success — Rendered Insights */}
                {aiInsights && !aiLoading && (
                  <div className="animate-fade-in">
                    <MarkdownRenderer content={aiInsights} />
                    
                    {/* Regenerate button */}
                    <div className="mt-6 pt-4 border-t border-border-subtle">
                      <button
                        onClick={handleGenerateInsights}
                        className="w-full py-3 rounded-xl bg-card-secondary border border-border text-txt-secondary font-semibold text-sm flex items-center justify-center gap-2 hover:bg-card hover:text-txt-primary transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" /> Regenerate Insights
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Delete Confirmation Sheet */}
      <BottomSheet 
        isOpen={!!deleteConfirmTarget}
        onClose={() => setDeleteConfirmTarget(null)}
      >
        <div className="pt-4 text-center">
          <div className="w-16 h-16 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-display tracking-wider text-txt-primary mb-2">Delete Session?</h3>
          <p className="text-sm text-txt-secondary mb-8">
            This action cannot be undone. All sets and volume for this day will be removed from your history.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirmTarget(null)}
              className="flex-1 py-4 rounded-xl bg-card-secondary text-txt-primary font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 py-4 rounded-xl bg-danger text-root font-semibold"
            >
              Delete
            </button>
          </div>
        </div>
      </BottomSheet>

    </div>
  )
}
