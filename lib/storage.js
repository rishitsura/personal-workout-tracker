import { HISTORICAL_LOGS, WORKOUT_PLANS } from './workoutData'

const STORAGE_KEYS = {
  LOGS: 'wt_logs',
  PROFILE: 'wt_profile',
  ACTIVE_SESSION: 'wt_active_session',
  SEEDED: 'wt_seeded',
}

export function seedHistoricalData() {
  if (typeof window === 'undefined') return
  const seeded = localStorage.getItem(STORAGE_KEYS.SEEDED)
  if (seeded) return
  const existing = getLogs()
  const existingDates = new Set(existing.map((l) => l.date))
  const toAdd = HISTORICAL_LOGS.filter((l) => !existingDates.has(l.date))
  const merged = [...existing, ...toAdd].sort((a, b) => a.date.localeCompare(b.date))
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(merged))
  localStorage.setItem(STORAGE_KEYS.SEEDED, '1')
}

export function getLogs() {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]')
  } catch {
    return []
  }
}

export function getLogForDate(date) {
  const logs = getLogs()
  return logs.find((l) => l.date === date) || null
}

export function saveLog(log) {
  const logs = getLogs()
  const idx = logs.findIndex((l) => l.date === log.date)
  if (idx >= 0) {
    logs[idx] = log
  } else {
    logs.push(log)
  }
  logs.sort((a, b) => a.date.localeCompare(b.date))
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs))
}

export function deleteLog(date) {
  const logs = getLogs().filter((l) => l.date !== date)
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs))
}

export function getProfile() {
  if (typeof window === 'undefined') return getDefaultProfile()
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE) || 'null') || getDefaultProfile()
  } catch {
    return getDefaultProfile()
  }
}

export function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile))
}

function getDefaultProfile() {
  return {
    name: 'Rishit',
    age: '',
    weight: '',
    height: '',
    goal: 'Build muscle',
    startDate: '2025-05-15',
    weightUnit: 'kg',
    heightUnit: 'cm',
  }
}

export function getActiveSession() {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION) || 'null')
  } catch {
    return null
  }
}

export function saveActiveSession(session) {
  if (session === null) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION)
  } else {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session))
  }
}

export function getLastWorkoutDayKey() {
  const logs = getLogs()
  if (!logs.length) return null
  const last = [...logs].sort((a, b) => b.date.localeCompare(a.date))[0]
  return last.dayKey
}

export function getSuggestedDayKey() {
  const lastKey = getLastWorkoutDayKey()
  if (!lastKey) return 'day1'
  const order = ['day1', 'day2', 'day3', 'day4', 'day5', 'day6']
  const idx = order.indexOf(lastKey)
  return order[(idx + 1) % order.length]
}

// Analytics
export function getInsights() {
  const logs = getLogs().filter((l) => l.completed)
  const totalSessions = logs.length
  const totalVolume = logs.reduce((acc, log) => {
    return (
      acc +
      (log.exercises || []).reduce((exAcc, ex) => {
        return (
          exAcc +
          (ex.sets || []).reduce((setAcc, set) => {
            return setAcc + (set.done ? (set.weight || 0) * (set.reps || 0) : 0)
          }, 0)
        )
      }, 0)
    )
  }, 0)

  // Streak
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    if (logs.find((l) => l.date === dateStr)) {
      streak++
    } else if (i > 0) {
      break
    }
  }

  // Per-day breakdown
  const dayBreakdown = {}
  logs.forEach((log) => {
    dayBreakdown[log.dayKey] = (dayBreakdown[log.dayKey] || 0) + 1
  })

  // Volume over time (last 14 sessions)
  const recentLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
  const volumeChart = recentLogs.map((log) => ({
    date: log.date,
    volume: (log.exercises || []).reduce((acc, ex) => {
      return (
        acc +
        (ex.sets || []).reduce((s, set) => {
          return s + (set.done ? (set.weight || 0) * (set.reps || 0) : 0)
        }, 0)
      )
    }, 0),
  }))

  // PR tracking per exercise
  const prs = {}
  logs.forEach((log) => {
    ;(log.exercises || []).forEach((ex) => {
      ;(ex.sets || []).forEach((set) => {
        if (set.done && set.weight > 0) {
          if (!prs[ex.id] || set.weight > prs[ex.id].weight) {
            prs[ex.id] = { name: ex.name, weight: set.weight, date: log.date }
          }
        }
      })
    })
  })

  return { totalSessions, totalVolume, streak, dayBreakdown, volumeChart, prs }
}
