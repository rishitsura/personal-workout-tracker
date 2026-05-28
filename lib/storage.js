import { HISTORICAL_LOGS, WORKOUT_PLANS, DAY_ORDER, MUSCLE_GROUP_MAP } from './workoutData'

const STORAGE_KEYS = {
  LOGS: 'wt_logs',
  PROFILE: 'wt_profile',
  ACTIVE_SESSION: 'wt_active_session',
  SEEDED: 'wt_seeded_v2',
  SKIPPED: 'wt_skipped_days',
}

// ========================================
// SEED & LOGS
// ========================================

export function seedHistoricalData() {
  if (typeof window === 'undefined') return
  const seeded = localStorage.getItem(STORAGE_KEYS.SEEDED)
  if (seeded) return
  // Clean up old 2025 data from previous buggy seed
  const existing = getLogs().filter((l) => !l.date.startsWith('2025-'))
  // Also clear any stale active session
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION)
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

// ========================================
// PROFILE
// ========================================

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
    startDate: '2026-05-15',
    weightUnit: 'kg',
    heightUnit: 'cm',
  }
}

// ========================================
// ACTIVE SESSION
// ========================================

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

// ========================================
// DAY PROGRESSION (FIXED LOGIC)
// ========================================

export function getLocalTodayStr(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getLastWorkoutDayKey(logs = getLogs()) {
  const completedLogs = logs.filter((l) => l.completed)
  if (!completedLogs.length) return null
  const last = [...completedLogs].sort((a, b) => b.date.localeCompare(a.date))[0]
  return last.dayKey
}

/**
 * Returns the next day in the workout cycle.
 * Logic: find the last COMPLETED workout's dayKey, return the next one in sequence.
 * If today already has a completed log, return that dayKey (show completed state).
 * Accounts for skipped days.
 */
export function getSuggestedDayKey(logs = getLogs()) {
  const today = getLocalTodayStr()
  const todayLog = logs.find((l) => l.date === today) || null

  // If today is already logged and completed, return that day
  if (todayLog && todayLog.completed) {
    return todayLog.dayKey
  }

  // Otherwise, look at last completed workout and suggest the next one
  const lastKey = getLastWorkoutDayKey(logs)
  if (!lastKey) return 'day1'

  const idx = DAY_ORDER.indexOf(lastKey)
  return DAY_ORDER[(idx + 1) % DAY_ORDER.length]
}

/**
 * Check if today's workout is already completed
 */
export function isTodayCompleted(logs = getLogs()) {
  const today = getLocalTodayStr()
  const log = logs.find((l) => l.date === today) || null
  return log && log.completed
}

// ========================================
// SKIP DAY
// ========================================

export function skipDay(dayKey) {
  // Record the skip in localStorage (fallback/reference)
  const skips = getSkippedDays()
  const today = getLocalTodayStr()
  skips.push({ dayKey, date: today })
  localStorage.setItem(STORAGE_KEYS.SKIPPED, JSON.stringify(skips))
}

export function getSkippedDays() {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SKIPPED) || '[]')
  } catch {
    return []
  }
}

/**
 * When user skips, we advance by storing the "last day" marker.
 * We use a special storage key for this.
 */
export function advanceDay(logs = getLogs(), saveLogFn = saveLog) {
  const current = getSuggestedDayKey(logs)
  const idx = DAY_ORDER.indexOf(current)
  const nextKey = DAY_ORDER[(idx + 1) % DAY_ORDER.length]

  // Store a skip marker locally
  const skips = getSkippedDays()
  const today = getLocalTodayStr()
  skips.push({ dayKey: current, date: today })
  localStorage.setItem(STORAGE_KEYS.SKIPPED, JSON.stringify(skips))

  // Save a minimal completed log so the day progression advances
  saveLogFn({
    date: today + '_skip',
    dayKey: current,
    completed: true,
    skipped: true,
    exercises: [],
  })

  return nextKey
}

// ========================================
// BASIC INSIGHTS
// ========================================

export function getInsights(logs = getLogs().filter((l) => l.completed && !l.skipped), profile = getProfile()) {
  const activeLogs = logs.filter((l) => l.completed && !l.skipped)
  const totalSessions = activeLogs.length
  const totalVolume = activeLogs.reduce((acc, log) => {
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

  // Streak — consecutive days with workouts (allowing 1-day gaps as rest)
  let streak = 0
  const today = new Date()
  const logDates = new Set(activeLogs.map((l) => l.date))
  let gapAllowed = true
  for (let i = 0; i < 60; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = getLocalTodayStr(d)
    if (logDates.has(dateStr)) {
      streak++
      gapAllowed = true
    } else if (i === 0) {
      // Today not trained yet is fine
      gapAllowed = true
    } else if (gapAllowed) {
      gapAllowed = false // Allow one gap (rest day)
    } else {
      break
    }
  }

  // Per-day breakdown
  const dayBreakdown = {}
  activeLogs.forEach((log) => {
    dayBreakdown[log.dayKey] = (dayBreakdown[log.dayKey] || 0) + 1
  })

  // Volume over time (last 14 sessions)
  const recentLogs = [...activeLogs].sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
  const volumeChart = recentLogs.map((log) => ({
    date: log.date,
    dayKey: log.dayKey,
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
  activeLogs.forEach((log) => {
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

  // Consistency
  const daysSinceStart = profile.startDate
    ? Math.max(1, Math.floor((new Date() - new Date(profile.startDate + 'T00:00:00')) / (1000 * 60 * 60 * 24)))
    : 1
  const consistency = Math.min(100, Math.round((totalSessions / daysSinceStart) * 100))

  return { totalSessions, totalVolume, streak, dayBreakdown, volumeChart, prs, consistency, daysSinceStart }
}

// ========================================
// ADVANCED ANALYSIS ENGINE
// ========================================

/**
 * Get exercise progression — weight over time for each exercise
 */
export function getExerciseProgression(logs = getLogs()) {
  const activeLogs = logs.filter((l) => l.completed && !l.skipped).sort((a, b) => a.date.localeCompare(b.date))
  const progressions = {}

  activeLogs.forEach((log) => {
    ;(log.exercises || []).forEach((ex) => {
      if (!progressions[ex.id]) {
        progressions[ex.id] = { name: ex.name, data: [] }
      }
      const doneSets = (ex.sets || []).filter((s) => s.done && s.weight > 0)
      if (doneSets.length > 0) {
        const maxWeight = Math.max(...doneSets.map((s) => s.weight))
        const totalVolume = doneSets.reduce((a, s) => a + (s.weight || 0) * (s.reps || 0), 0)
        progressions[ex.id].data.push({ date: log.date, maxWeight, volume: totalVolume })
      }
    })
  })

  return progressions
}

/**
 * Plateau detection — exercises with no weight increase in 3+ sessions
 */
export function getPlateaus(logs = getLogs()) {
  const progressions = getExerciseProgression(logs)
  const plateaus = []

  Object.entries(progressions).forEach(([id, { name, data }]) => {
    if (data.length >= 3) {
      const last3 = data.slice(-3)
      const weights = last3.map((d) => d.maxWeight)
      // Plateau if max weight hasn't increased
      if (weights.every((w) => w <= weights[0])) {
        plateaus.push({ id, name, weight: weights[0], sessions: last3.length })
      }
    }
  })

  return plateaus
}

/**
 * Muscle group volume balance
 */
export function getMuscleGroupBalance(logs = getLogs()) {
  const activeLogs = logs.filter((l) => l.completed && !l.skipped)
  const balance = {}

  activeLogs.forEach((log) => {
    ;(log.exercises || []).forEach((ex) => {
      const group = MUSCLE_GROUP_MAP[ex.id] || 'Other'
      if (group === 'Cardio') return // Skip cardio for balance
      const volume = (ex.sets || []).reduce(
        (a, s) => a + (s.done ? (s.weight || 0) * (s.reps || 0) : 0),
        0
      )
      balance[group] = (balance[group] || 0) + volume
    })
  })

  return balance
}

/**
 * Weekly volume data
 */
export function getWeeklyVolumes(logs = getLogs()) {
  const activeLogs = logs.filter((l) => l.completed && !l.skipped).sort((a, b) => a.date.localeCompare(b.date))
  const weeks = {}

  activeLogs.forEach((log) => {
    const d = new Date(log.date + 'T00:00:00')
    // Get Monday of this week
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d)
    monday.setDate(diff)
    const weekKey = getLocalTodayStr(monday)

    if (!weeks[weekKey]) weeks[weekKey] = { volume: 0, sessions: 0, weekStart: weekKey }

    const volume = (log.exercises || []).reduce(
      (a, ex) =>
        a + (ex.sets || []).reduce((s, set) => s + (set.done ? (set.weight || 0) * (set.reps || 0) : 0), 0),
      0
    )

    weeks[weekKey].volume += volume
    weeks[weekKey].sessions++
  })

  return Object.values(weeks).sort((a, b) => a.weekStart.localeCompare(b.weekStart))
}

/**
 * Most improved exercises (biggest weight jump from first to last session)
 */
export function getMostImproved(logs = getLogs()) {
  const progressions = getExerciseProgression(logs)
  const improvements = []

  Object.entries(progressions).forEach(([id, { name, data }]) => {
    if (data.length >= 2) {
      const first = data[0].maxWeight
      const last = data[data.length - 1].maxWeight
      const improvement = last - first
      const percentImprovement = first > 0 ? Math.round((improvement / first) * 100) : 0
      if (improvement > 0) {
        improvements.push({ id, name, from: first, to: last, improvement, percentImprovement })
      }
    }
  })

  return improvements.sort((a, b) => b.improvement - a.improvement)
}

/**
 * Smart training recommendations — pure logic, no AI
 */
export function getRecommendations(logs = getLogs(), profile = getProfile()) {
  const activeLogs = logs.filter((l) => l.completed && !l.skipped)
  const insights = getInsights(activeLogs, profile)
  const plateaus = getPlateaus(logs)
  const balance = getMuscleGroupBalance(logs)
  const mostImproved = getMostImproved(logs)
  const recommendations = []

  // Streak-based
  if (insights.streak >= 6) {
    recommendations.push({
      type: 'rest',
      icon: 'pause',
      title: 'Rest Day Recommended',
      text: `You've trained ${insights.streak} days straight. Take a rest day — muscles grow during recovery.`,
    })
  } else if (insights.streak >= 4) {
    recommendations.push({
      type: 'praise',
      icon: 'fire',
      title: 'On Fire!',
      text: `${insights.streak}-day streak! You're crushing it. Keep listening to your body.`,
    })
  }

  // Plateaus
  plateaus.slice(0, 3).forEach((p) => {
    recommendations.push({
      type: 'plateau',
      icon: 'alert',
      title: `Plateau: ${p.name}`,
      text: `Stuck at ${p.weight}kg for ${p.sessions}+ sessions. Try adding 1-2.5kg, or increase reps by 2.`,
    })
  })

  // Muscle group balance
  const groups = Object.entries(balance).filter(([g]) => g !== 'Cardio' && g !== 'Other')
  if (groups.length > 1) {
    const max = Math.max(...groups.map(([, v]) => v))
    const min = Math.min(...groups.map(([, v]) => v))
    const weakest = groups.find(([, v]) => v === min)
    const strongest = groups.find(([, v]) => v === max)
    if (weakest && strongest && max > min * 2.5) {
      recommendations.push({
        type: 'balance',
        icon: 'scale',
        title: 'Muscle Imbalance',
        text: `${strongest[0]} volume is much higher than ${weakest[0]}. Consider extra ${weakest[0].toLowerCase()} work.`,
      })
    }
  }

  // Consistency
  if (insights.consistency >= 60) {
    recommendations.push({
      type: 'praise',
      icon: 'trophy',
      title: 'Great Consistency!',
      text: `${insights.consistency}% training consistency over ${insights.daysSinceStart} days. Elite discipline.`,
    })
  } else if (insights.consistency >= 30 && insights.totalSessions > 5) {
    recommendations.push({
      type: 'info',
      icon: 'target',
      title: 'Room to Improve',
      text: `${insights.consistency}% consistency. Aim for 5 sessions/week to maximize progress.`,
    })
  }

  // Most improved
  if (mostImproved.length > 0) {
    const top = mostImproved[0]
    recommendations.push({
      type: 'praise',
      icon: 'trending',
      title: `Strongest Gain: ${top.name}`,
      text: `Up ${top.improvement}kg (${top.from} → ${top.to}kg). ${top.percentImprovement > 0 ? `That's +${top.percentImprovement}%!` : ''}`,
    })
  }

  // Volume trend
  const weeklyVols = getWeeklyVolumes(logs)
  if (weeklyVols.length >= 2) {
    const last = weeklyVols[weeklyVols.length - 1]
    const prev = weeklyVols[weeklyVols.length - 2]
    const diff = last.volume - prev.volume
    const pctDiff = prev.volume > 0 ? Math.round((diff / prev.volume) * 100) : 0
    if (pctDiff > 10) {
      recommendations.push({
        type: 'praise',
        icon: 'chart',
        title: 'Volume Up!',
        text: `This week's volume is ${pctDiff}% higher than last week. Progressive overload working!`,
      })
    } else if (pctDiff < -15) {
      recommendations.push({
        type: 'info',
        icon: 'chart',
        title: 'Volume Dropped',
        text: `This week's volume is ${Math.abs(pctDiff)}% lower than last week. Make sure you're hitting your sets.`,
      })
    }
  }

  return recommendations
}

/**
 * Get a 30-day calendar heatmap showing workout days
 */
export function getCalendarHeatmap(logs = getLogs()) {
  const activeLogs = logs.filter((l) => l.completed && !l.skipped)
  const logMap = {}
  activeLogs.forEach((l) => {
    logMap[l.date] = l.dayKey
  })

  const days = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = getLocalTodayStr(d)
    const dayKey = logMap[dateStr] || null
    days.push({
      date: dateStr,
      dayKey,
      dayOfWeek: d.getDay(),
      dayOfMonth: d.getDate(),
      isToday: i === 0,
    })
  }

  return days
}
