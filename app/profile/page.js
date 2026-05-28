'use client'
import { useState, useEffect } from 'react'
import BottomNav from '../../components/BottomNav'
import { getProfile, saveProfile, getLogs, getInsights } from '../../lib/storage'
import { WORKOUT_PLANS } from '../../lib/workoutData'

const GOALS = ['Build muscle', 'Lose fat', 'Improve strength', 'General fitness', 'Athletic performance']

function Field({ label, value, onChange, type = 'text', suffix, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600' }}>{label}</label>
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%', height: '44px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px',
            color: '#f5f5f5', fontSize: '14px', padding: '0 12px', outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
            appearance: 'none', WebkitAppearance: 'none',
          }}
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ) : (
        <div style={{ position: 'relative' }}>
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%', height: '44px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px',
              color: '#f5f5f5', fontSize: '14px', padding: '0 12px', outline: 'none', fontFamily: 'inherit',
              paddingRight: suffix ? '36px' : '12px',
            }}
          />
          {suffix && (
            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#555' }}>
              {suffix}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [saved, setSaved] = useState(false)
  const [insights, setInsights] = useState(null)
  const [totalDays, setTotalDays] = useState(0)

  useEffect(() => {
    setProfile(getProfile())
    setInsights(getInsights())
    const logs = getLogs().filter((l) => l.completed)
    setTotalDays(logs.length)
  }, [])

  function handleSave() {
    saveProfile(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function update(key, val) {
    setProfile((p) => ({ ...p, [key]: val }))
  }

  if (!profile) return null

  const daysSinceStart = profile.startDate
    ? Math.floor((new Date() - new Date(profile.startDate + 'T00:00:00')) / (1000 * 60 * 60 * 24))
    : 0

  const bmi =
    profile.weight && profile.height
      ? (parseFloat(profile.weight) / Math.pow(parseFloat(profile.height) / 100, 2)).toFixed(1)
      : null

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: '90px' }}>
      {/* Hero */}
      <div style={{ padding: '28px 20px 20px', background: '#0a0a0a', borderBottom: '1px solid #111' }}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div
            style={{
              width: '64px', height: '64px', borderRadius: '18px',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '26px', fontFamily: "'Bebas Neue', sans-serif",
              color: '#fff', letterSpacing: '0.04em', flexShrink: 0,
              boxShadow: '0 4px 20px rgba(249,115,22,0.3)',
            }}
          >
            {(profile.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '0.04em', color: '#f5f5f5', lineHeight: 1 }}>
              {profile.name || 'Athlete'}
            </div>
            <div style={{ fontSize: '12px', color: '#555', marginTop: '3px' }}>
              {profile.goal}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Days', value: `${daysSinceStart}`, sub: 'since start' },
            { label: 'Sessions', value: `${totalDays}`, sub: 'completed' },
            { label: 'Streak', value: `${insights?.streak || 0}d`, sub: 'current' },
          ].map((s) => (
            <div key={s.label} style={{ background: '#111', borderRadius: '12px', border: '1px solid #1e1e1e', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#f97316', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em' }}>{s.value}</div>
              <div style={{ fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* BMI if available */}
        {bmi && (
          <div style={{ marginTop: '12px', padding: '10px 14px', background: '#111', borderRadius: '10px', border: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>BMI</span>
            <span style={{ fontSize: '16px', fontWeight: '800', color: parseFloat(bmi) < 18.5 ? '#3b82f6' : parseFloat(bmi) < 25 ? '#22c55e' : parseFloat(bmi) < 30 ? '#f97316' : '#ef4444', fontFamily: "'Bebas Neue', sans-serif" }}>
              {bmi} — {parseFloat(bmi) < 18.5 ? 'Underweight' : parseFloat(bmi) < 25 ? 'Normal' : parseFloat(bmi) < 30 ? 'Overweight' : 'Obese'}
            </span>
          </div>
        )}
      </div>

      {/* Edit profile */}
      <div style={{ padding: '20px' }}>
        <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600', marginBottom: '14px' }}>
          Profile Details
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Field label="Name" value={profile.name} onChange={(v) => update('name', v)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Field label="Age" value={profile.age} onChange={(v) => update('age', v)} type="number" suffix="yrs" />
            <Field label="Weight" value={profile.weight} onChange={(v) => update('weight', v)} type="number" suffix={profile.weightUnit} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Field label="Height" value={profile.height} onChange={(v) => update('height', v)} type="number" suffix={profile.heightUnit} />
            <Field label="Start Date" value={profile.startDate} onChange={(v) => update('startDate', v)} type="date" />
          </div>
          <Field label="Goal" value={profile.goal} onChange={(v) => update('goal', v)} options={GOALS} />
        </div>

        <button
          onClick={handleSave}
          style={{
            marginTop: '20px', width: '100%', height: '52px', borderRadius: '14px', border: 'none',
            background: saved ? '#22c55e' : 'linear-gradient(135deg, #f97316, #ea580c)',
            color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
            letterSpacing: '0.04em', transition: 'background 0.3s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: saved ? '0 4px 20px rgba(34,197,94,0.3)' : '0 4px 20px rgba(249,115,22,0.25)',
          }}
        >
          {saved ? '✓ Saved!' : 'Save Profile'}
        </button>
      </div>

      {/* Workout plan reference */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600', marginBottom: '14px' }}>
          Your Split
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(WORKOUT_PLANS).map(([key, plan]) => (
            <div key={key} style={{ padding: '12px 14px', background: '#111', borderRadius: '12px', border: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '18px' }}>{plan.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#ddd' }}>{plan.label} — {plan.name}</div>
                <div style={{ fontSize: '10px', color: '#555', marginTop: '1px' }}>{plan.exercises.map((e) => e.name).join(', ')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
