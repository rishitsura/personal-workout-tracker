'use client'
import { useState, useEffect } from 'react'
import BottomNav from '../../components/BottomNav'
import { getInsights } from '../../lib/storage'
import { WORKOUT_PLANS } from '../../lib/workoutData'
import { useWorkout } from '../../lib/workoutContext'
import { auth, signOut, isFirebaseConfigured } from '../../lib/firebase'

const GOALS = ['Build muscle', 'Lose fat', 'Improve strength', 'General fitness', 'Athletic performance']

function Field({ label, value, onChange, type = 'text', suffix, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '11px', color: '#4a4a4a', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600' }}>
        {label}
      </label>
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%', height: '48px', background: '#161616',
            border: '1px solid #1e1e1e', borderRadius: '12px',
            color: '#f0f0f0', fontSize: '14px', padding: '0 14px',
            outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
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
            inputMode={type === 'number' ? 'decimal' : undefined}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%', height: '48px', background: '#161616',
              border: '1px solid #1e1e1e', borderRadius: '12px',
              color: '#f0f0f0', fontSize: '14px', padding: '0 14px',
              outline: 'none', fontFamily: 'inherit',
              paddingRight: suffix ? '40px' : '14px',
            }}
          />
          {suffix && (
            <span style={{
              position: 'absolute', right: '14px', top: '50%',
              transform: 'translateY(-50%)', fontSize: '12px', color: '#4a4a4a',
            }}>
              {suffix}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { logs: contextLogs, profile: contextProfile, saveProfile: contextSaveProfile } = useWorkout()
  const [profile, setProfile] = useState(null)
  const [saved, setSaved] = useState(false)

  // Initialize local profile editing state
  useEffect(() => {
    if (contextProfile) {
      setProfile(contextProfile)
    }
  }, [contextProfile])

  function handleSave() {
    contextSaveProfile(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function update(key, val) {
    setProfile((p) => ({ ...p, [key]: val }))
  }

  if (!profile) return null

  // Derived stats from context logs
  const insights = getInsights(contextLogs, profile)
  const totalDays = contextLogs.filter((l) => l.completed && !l.skipped).length

  const daysSinceStart = profile.startDate
    ? Math.floor((new Date() - new Date(profile.startDate + 'T00:00:00')) / (1000 * 60 * 60 * 24))
    : 0

  const bmi =
    profile.weight && profile.height
      ? (parseFloat(profile.weight) / Math.pow(parseFloat(profile.height) / 100, 2)).toFixed(1)
      : null

  const bmiCategory = bmi
    ? parseFloat(bmi) < 18.5 ? 'Underweight'
      : parseFloat(bmi) < 25 ? 'Normal'
      : parseFloat(bmi) < 30 ? 'Overweight'
      : 'Obese'
    : null

  const bmiColor = bmi
    ? parseFloat(bmi) < 18.5 ? '#3b82f6'
      : parseFloat(bmi) < 25 ? '#22c55e'
      : parseFloat(bmi) < 30 ? '#f97316'
      : '#ef4444'
    : '#555'

  return (
    <div style={{ minHeight: '100dvh', background: '#050505' }} className="safe-bottom">
      {/* Hero section */}
      <div style={{
        padding: '28px 20px 24px',
        background: 'linear-gradient(180deg, #0f0f0f 0%, #050505 100%)',
        borderBottom: '1px solid #111',
      }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', fontFamily: "'Bebas Neue', sans-serif",
            color: '#fff', letterSpacing: '0.04em', flexShrink: 0,
            boxShadow: '0 4px 24px rgba(249,115,22,0.25)',
          }}>
            {(profile.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px',
              letterSpacing: '0.04em', color: '#f0f0f0', lineHeight: 1,
            }}>
              {profile.name || 'Athlete'}
            </div>
            <div style={{ fontSize: '12px', color: '#4a4a4a', marginTop: '4px' }}>
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
            <div key={s.label} style={{
              background: '#0f0f0f', borderRadius: '14px', border: '1px solid #161616',
              padding: '14px', textAlign: 'center',
            }}>
              <div style={{
                fontSize: '22px', fontWeight: '800', color: '#f97316',
                fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em',
              }}>
                {s.value}
              </div>
              <div style={{
                fontSize: '9px', color: '#4a4a4a', textTransform: 'uppercase',
                letterSpacing: '0.08em', marginTop: '2px',
              }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        {/* BMI */}
        {bmi && (
          <div style={{
            marginTop: '12px', padding: '12px 16px',
            background: '#0f0f0f', borderRadius: '12px', border: '1px solid #161616',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '13px', color: '#555' }}>BMI</span>
            <span style={{
              fontSize: '18px', fontWeight: '800', color: bmiColor,
              fontFamily: "'Bebas Neue', sans-serif",
            }}>
              {bmi} — {bmiCategory}
            </span>
          </div>
        )}
      </div>

      {/* Profile details form */}
      <div style={{ padding: '24px 20px' }}>
        <div style={{
          fontSize: '11px', color: '#4a4a4a', textTransform: 'uppercase',
          letterSpacing: '0.1em', fontWeight: '600', marginBottom: '16px',
        }}>
          Profile Details
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
            marginTop: '24px', width: '100%', height: '52px', borderRadius: '14px', border: 'none',
            background: saved ? '#22c55e' : 'linear-gradient(135deg, #f97316, #ea580c)',
            color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
            letterSpacing: '0.04em', transition: 'all 0.3s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: saved ? '0 4px 20px rgba(34,197,94,0.25)' : '0 4px 20px rgba(249,115,22,0.2)',
          }}
        >
          {saved ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Saved!
            </>
          ) : (
            'Save Profile'
          )}
        </button>
        {isFirebaseConfigured() && auth.currentUser && (
          <button
            onClick={() => signOut(auth)}
            style={{
              marginTop: '10px', width: '100%', height: '48px', borderRadius: '14px',
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
              letterSpacing: '0.04em', transition: 'all 0.3s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        )}
      </div>

      {/* Workout split */}
      <div style={{ padding: '0 20px 24px' }}>
        <div style={{
          fontSize: '11px', color: '#4a4a4a', textTransform: 'uppercase',
          letterSpacing: '0.1em', fontWeight: '600', marginBottom: '14px',
        }}>
          Your Training Split
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Object.entries(WORKOUT_PLANS).map(([key, plan]) => (
            <div key={key} style={{
              padding: '14px 16px', background: '#0f0f0f',
              borderRadius: '14px', border: '1px solid #161616',
              display: 'flex', alignItems: 'center', gap: '14px',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: `${plan.color}10`, border: `1px solid ${plan.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: plan.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#ddd' }}>
                  {plan.label} — {plan.name}
                </div>
                <div style={{
                  fontSize: '11px', color: '#3a3a3a', marginTop: '3px', lineHeight: 1.4,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {plan.exercises.map((e) => e.name).join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
