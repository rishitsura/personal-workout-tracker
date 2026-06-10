// ========================================
// DATE HELPERS
// ========================================

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getToday() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Format a date string to a display format
 * @param {string} dateStr - YYYY-MM-DD
 * @param {object} opts - Intl.DateTimeFormat options
 */
export function formatDate(dateStr, opts = {}) {
  const date = new Date(dateStr + 'T00:00:00')
  const defaults = { weekday: 'short', month: 'short', day: 'numeric' }
  return date.toLocaleDateString('en-US', { ...defaults, ...opts })
}

/**
 * Format date as short: "Mon 26"
 */
export function formatDateShort(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
}

/**
 * Get the full display date: "Wednesday, May 28, 2026"
 */
export function formatDateFull(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Get Mon-Sun dates for the week containing the given date
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {string[]} Array of 7 YYYY-MM-DD strings
 */
export function getWeekDays(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  const dayOfWeek = date.getDay() // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(date)
  monday.setDate(date.getDate() + mondayOffset)

  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

/**
 * Get day name abbreviation from date string
 */
export function getDayAbbr(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)
}

/**
 * Get how many days ago a date was
 */
export function daysAgo(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date(getToday() + 'T00:00:00')
  return Math.floor((today - date) / (1000 * 60 * 60 * 24))
}


// ========================================
// BMI HELPERS
// ========================================

/**
 * Calculate BMI from weight (kg) and height (cm)
 */
export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0) return null
  const heightM = heightCm / 100
  return (weightKg / (heightM * heightM)).toFixed(1)
}

/**
 * Get BMI classification with color
 */
export function getBMIClassification(bmi) {
  if (!bmi) return { label: '—', color: '#888888' }
  const val = parseFloat(bmi)
  if (val < 18.5) return { label: 'Underweight', color: '#3b82f6' }
  if (val < 25) return { label: 'Normal', color: '#22c55e' }
  if (val < 30) return { label: 'Overweight', color: '#f59e0b' }
  return { label: 'Obese', color: '#ef4444' }
}


// ========================================
// WORKOUT HELPERS
// ========================================

/**
 * Given the last logged day key (e.g. 'day3'), return the next in cycle
 * Cycles: day1 → day2 → day3 → day4 → day5 → day6 → day1
 */
export function getNextDayKey(lastDayKey) {
  if (!lastDayKey) return 'day1'
  const num = parseInt(lastDayKey.replace('day', ''), 10)
  const next = num >= 6 ? 1 : num + 1
  return `day${next}`
}

/**
 * Calculate total volume for a session (sum of weight × reps for all done sets)
 */
export function calculateSessionVolume(exercises) {
  if (!exercises) return 0
  let total = 0
  for (const ex of exercises) {
    for (const set of ex.sets || []) {
      if (set.done) {
        total += (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0)
      }
    }
  }
  return total
}

/**
 * Count total sets and completed sets in a session
 */
export function countSets(exercises) {
  let total = 0
  let done = 0
  for (const ex of exercises || []) {
    for (const set of ex.sets || []) {
      total++
      if (set.done) done++
    }
  }
  return { total, done }
}

/**
 * Calculate current streak from sessions (consecutive days with workouts)
 */
export function calculateStreak(sessions) {
  if (!sessions || sessions.length === 0) return 0

  const sortedDates = sessions
    .filter(s => s.completed)
    .map(s => s.date)
    .sort()
    .reverse()

  if (sortedDates.length === 0) return 0

  const today = getToday()
  let streak = 0
  let checkDate = today

  // Allow today or yesterday as the start
  if (sortedDates[0] !== today) {
    const yesterday = new Date(today + 'T00:00:00')
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    if (sortedDates[0] !== yesterdayStr) return 0
    checkDate = yesterdayStr
  }

  const dateSet = new Set(sortedDates)
  const current = new Date(checkDate + 'T00:00:00')

  while (dateSet.has(current.toISOString().split('T')[0])) {
    streak++
    current.setDate(current.getDate() - 1)
  }

  return streak
}


// ========================================
// FORMAT HELPERS
// ========================================

/**
 * Format volume number with commas: 12345 → "12,345"
 */
export function formatVolume(kg) {
  if (!kg && kg !== 0) return '0'
  return Math.round(kg).toLocaleString('en-US')
}

/**
 * Format seconds to MM:SS display
 */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}


// ========================================
// ID GENERATION
// ========================================

/**
 * Generate a short unique ID for exercises
 */
export function generateId() {
  return Math.random().toString(36).substring(2, 10)
}
