'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/authContext'
import { 
  getProfile, saveProfile, 
  getBodyWeightLog, saveBodyWeight,
  getSessions
} from '../../../lib/firestoreService'
import { getToday, calculateBMI, getBMIClassification, formatDateShort, calculateStreak } from '../../../lib/utils'
import { FITNESS_GOALS, getDayEmoji } from '../../../lib/workoutData'

import { SparkLine } from '../../../components/InsightCharts'
import { LogOut, User, Activity, Settings, Plus, Weight, Edit2, Flame } from 'lucide-react'

export default function ProfilePage() {
  const { user, logOut } = useAuth()
  const router = useRouter()
  
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ totalSessions: 0, streak: 0 })
  const [weightLog, setWeightLog] = useState([])
  const [loading, setLoading] = useState(true)
  
  // UI State
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [newWeight, setNewWeight] = useState('')

  // ========================================
  // INITIAL LOAD
  // ========================================
  useEffect(() => {
    if (!user) return
    const loadData = async () => {
      try {
        const [profData, wLog, sessions] = await Promise.all([
          getProfile(user.uid),
          getBodyWeightLog(user.uid),
          getSessions(user.uid)
        ])
        
        setProfile(profData)
        setEditForm(profData || {})
        setWeightLog(wLog)
        
        setStats({
          totalSessions: sessions.filter(s => s.completed).length,
          streak: calculateStreak(sessions)
        })
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  // ========================================
  // PROFILE SAVING
  // ========================================
  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    try {
      const dataToSave = {
        ...editForm,
        age: parseInt(editForm.age) || 0,
        height: parseFloat(editForm.height) || 0,
      }
      await saveProfile(user.uid, dataToSave)
      setProfile(dataToSave)
      setIsEditing(false)
    } catch (err) {
      console.error('Error saving profile:', err)
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  // ========================================
  // BODY WEIGHT LOGGING
  // ========================================
  const handleLogWeight = async () => {
    if (!user || !newWeight.trim()) return
    const today = getToday()
    const weightVal = parseFloat(newWeight)
    if (isNaN(weightVal)) return

    try {
      await saveBodyWeight(user.uid, today, weightVal)
      
      // Update local state
      const updatedLog = [...weightLog.filter(l => l.date !== today), { date: today, weight: weightVal }]
        .sort((a, b) => a.date.localeCompare(b.date))
      setWeightLog(updatedLog)
      
      // Also update current profile weight if it's the newest entry
      if (today >= updatedLog[updatedLog.length - 1].date) {
        await saveProfile(user.uid, { ...profile, weight: weightVal })
        setProfile(prev => ({ ...prev, weight: weightVal }))
      }
      
      setNewWeight('')
    } catch (err) {
      console.error('Error saving body weight:', err)
      alert('Failed to save weight')
    }
  }


  // ========================================
  // HELPERS
  // ========================================
  const handleLogout = async () => {
    if (!confirm('Are you sure you want to sign out?')) return
    await logOut()
    router.replace('/')
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin-slow" />
      </div>
    )
  }

  const bmi = calculateBMI(profile?.weight, profile?.height)
  const bmiClass = getBMIClassification(bmi)
  const initials = profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'
  const sparkData = weightLog.length > 0 ? weightLog.map(l => l.weight) : (profile?.weight ? [profile.weight] : [])

  return (
    <div className="flex flex-col flex-1 pb-10">
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-root/95 backdrop-blur-md pt-12 pb-4 px-6 border-b border-border-subtle flex items-end justify-between">
        <h1 className="font-display text-4xl tracking-wider text-txt-primary leading-none">PROFILE</h1>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="text-accent hover:text-accent-light p-1">
            <Edit2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="px-4 py-6 space-y-6">
        
        {/* ======================================== */}
        {/* AVATAR & BASIC INFO                      */}
        {/* ======================================== */}
        <div className="bg-card border border-border rounded-3xl p-6 text-center relative overflow-hidden animate-fade-in-up">
          {/* Subtle background glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/20 text-3xl font-display text-root">
            {initials}
          </div>
          
          {isEditing ? (
            <div className="space-y-3 mt-4 text-left">
              <div>
                <label className="text-[10px] text-txt-muted font-bold uppercase tracking-wider mb-1 block">Name</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="w-full bg-card-secondary border border-border-subtle rounded-xl px-3 py-2 text-sm text-txt-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-txt-muted font-bold uppercase tracking-wider mb-1 block">Age</label>
                  <input
                    type="number"
                    value={editForm.age || ''}
                    onChange={e => setEditForm({...editForm, age: e.target.value})}
                    className="w-full bg-card-secondary border border-border-subtle rounded-xl px-3 py-2 text-sm text-txt-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-txt-muted font-bold uppercase tracking-wider mb-1 block">Height (cm)</label>
                  <input
                    type="number"
                    value={editForm.height || ''}
                    onChange={e => setEditForm({...editForm, height: e.target.value})}
                    className="w-full bg-card-secondary border border-border-subtle rounded-xl px-3 py-2 text-sm text-txt-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-txt-muted font-bold uppercase tracking-wider mb-1 block">Goal</label>
                <select
                  value={editForm.goal || ''}
                  onChange={e => setEditForm({...editForm, goal: e.target.value})}
                  className="w-full bg-card-secondary border border-border-subtle rounded-xl px-3 py-2 text-sm text-txt-primary"
                >
                  {FITNESS_GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => { setIsEditing(false); setEditForm(profile) }}
                  className="flex-1 py-2 rounded-lg bg-card border border-border text-txt-primary text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-accent text-root text-sm font-bold flex justify-center"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-root border-t-transparent rounded-full animate-spin-slow" /> : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-txt-primary">{profile?.name}</h2>
              <p className="text-sm text-txt-secondary mt-1">{profile?.goal}</p>
              
              <div className="flex justify-center gap-6 mt-6">
                <div>
                  <div className="text-xs text-txt-muted uppercase font-semibold tracking-wider mb-1">Weight</div>
                  <div className="text-lg font-mono text-txt-primary">{profile?.weight}<span className="text-[10px] ml-0.5 text-txt-muted">kg</span></div>
                </div>
                <div className="w-px h-10 bg-border-subtle" />
                <div>
                  <div className="text-xs text-txt-muted uppercase font-semibold tracking-wider mb-1">Height</div>
                  <div className="text-lg font-mono text-txt-primary">{profile?.height}<span className="text-[10px] ml-0.5 text-txt-muted">cm</span></div>
                </div>
                <div className="w-px h-10 bg-border-subtle" />
                <div>
                  <div className="text-xs text-txt-muted uppercase font-semibold tracking-wider mb-1">BMI</div>
                  <div className="text-lg font-mono" style={{ color: bmiClass.color }}>{bmi}</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ======================================== */}
        {/* STATS                                    */}
        {/* ======================================== */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-info" />
            </div>
            <div>
              <div className="text-xl font-display tracking-wider text-txt-primary leading-none mb-1">{stats.totalSessions}</div>
              <div className="text-[10px] text-txt-muted uppercase font-semibold">Total Sessions</div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-xl font-display tracking-wider text-txt-primary leading-none mb-1">{stats.streak}</div>
              <div className="text-[10px] text-txt-muted uppercase font-semibold">Current Streak</div>
            </div>
          </div>
        </div>


        {/* ======================================== */}
        {/* BODY WEIGHT TRACKER                      */}
        {/* ======================================== */}
        <div className="bg-card border border-border rounded-3xl p-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Weight className="w-5 h-5 text-txt-primary" />
            <h3 className="text-base font-semibold text-txt-primary">Body Weight</h3>
          </div>

          <div className="h-16 mb-6">
            <SparkLine data={sparkData} color="#3b82f6" />
          </div>

          <div className="flex gap-2 mb-6">
            <input
              type="number"
              value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
              placeholder="Enter today's weight (kg)"
              className="flex-1 bg-card-secondary border border-border-subtle rounded-xl px-4 py-2 text-sm text-txt-primary focus:border-accent"
            />
            <button
              onClick={handleLogWeight}
              disabled={!newWeight.trim()}
              className="w-10 rounded-xl bg-info text-root flex items-center justify-center disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {weightLog.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-txt-muted uppercase font-semibold tracking-wider mb-2">History</div>
              {weightLog.slice(-5).reverse().map((log, i) => (
                <div key={`${log.date}-${i}`} className="flex justify-between items-center text-sm py-1.5 border-b border-border-subtle last:border-0">
                  <span className="text-txt-secondary">{formatDateShort(log.date)}</span>
                  <span className="text-txt-primary font-mono">{log.weight} kg</span>
                </div>
              ))}
            </div>
          )}
        </div>


        {/* ======================================== */}
        {/* ACTIONS                                  */}
        {/* ======================================== */}
        <div className="pt-4 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <button
            onClick={handleLogout}
            className="w-full bg-danger/10 text-danger font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-danger/20 transition-colors"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>

      </div>
    </div>
  )
}
