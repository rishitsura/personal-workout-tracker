import { db } from './firebase'
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'

// ========================================
// USER / PROFILE
// ========================================

/** Check if a user document exists in Firestore */
export async function checkUserExists(uid) {
  const ref = doc(db, 'users', uid, 'profile', 'data')
  const snap = await getDoc(ref)
  return snap.exists()
}

/** Save user profile */
export async function saveProfile(uid, profileData) {
  const ref = doc(db, 'users', uid, 'profile', 'data')
  await setDoc(ref, { ...profileData, updatedAt: serverTimestamp() }, { merge: true })
}

/** Get user profile */
export async function getProfile(uid) {
  const ref = doc(db, 'users', uid, 'profile', 'data')
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

/** Subscribe to profile changes */
export function subscribeToProfile(uid, callback) {
  const ref = doc(db, 'users', uid, 'profile', 'data')
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? snap.data() : null)
  })
}


// ========================================
// WORKOUT PLAN
// ========================================

/** Save workout plan */
export async function savePlan(uid, planData) {
  const ref = doc(db, 'users', uid, 'plan', 'data')
  await setDoc(ref, { ...planData, updatedAt: serverTimestamp() })
}

/** Get workout plan */
export async function getPlan(uid) {
  const ref = doc(db, 'users', uid, 'plan', 'data')
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

/** Subscribe to plan changes (for real-time sync on Today page) */
export function subscribeToPlan(uid, callback) {
  const ref = doc(db, 'users', uid, 'plan', 'data')
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? snap.data() : null)
  })
}


// ========================================
// SESSIONS (COMPLETED WORKOUTS)
// ========================================

/** Save a completed workout session */
export async function saveSession(uid, date, sessionData) {
  const ref = doc(db, 'users', uid, 'sessions', date)
  await setDoc(ref, {
    ...sessionData,
    date,
    completed: true,
    completedAt: serverTimestamp(),
  })
}

/** Get a single session by date */
export async function getSession(uid, date) {
  const ref = doc(db, 'users', uid, 'sessions', date)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

/** Get all sessions */
export async function getSessions(uid) {
  const ref = collection(db, 'users', uid, 'sessions')
  const snap = await getDocs(ref)
  const sessions = []
  snap.forEach((doc) => sessions.push({ id: doc.id, ...doc.data() }))
  return sessions.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
}

/** Delete a session */
export async function deleteSession(uid, date) {
  const ref = doc(db, 'users', uid, 'sessions', date)
  await deleteDoc(ref)
}

/** Subscribe to all sessions (real-time) */
export function subscribeToSessions(uid, callback) {
  const ref = collection(db, 'users', uid, 'sessions')
  return onSnapshot(ref, (snap) => {
    const sessions = []
    snap.forEach((doc) => sessions.push({ id: doc.id, ...doc.data() }))
    sessions.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    callback(sessions)
  })
}


// ========================================
// ACTIVE SESSION (IN-PROGRESS WORKOUT)
// ========================================

/** Save active (in-progress) session */
export async function saveActiveSession(uid, sessionData) {
  const ref = doc(db, 'users', uid, 'activeSession', 'data')
  await setDoc(ref, sessionData)
}

/** Get active session */
export async function getActiveSession(uid) {
  const ref = doc(db, 'users', uid, 'activeSession', 'data')
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

/** Clear active session (after completing or discarding) */
export async function clearActiveSession(uid) {
  const ref = doc(db, 'users', uid, 'activeSession', 'data')
  await deleteDoc(ref)
}

/** Subscribe to active session */
export function subscribeToActiveSession(uid, callback) {
  const ref = doc(db, 'users', uid, 'activeSession', 'data')
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? snap.data() : null)
  })
}


// ========================================
// BODY WEIGHT LOG
// ========================================

/** Save a body weight entry */
export async function saveBodyWeight(uid, date, weight) {
  const ref = doc(db, 'users', uid, 'bodyWeight', date)
  await setDoc(ref, { date, weight: parseFloat(weight), createdAt: serverTimestamp() })
}

/** Get all body weight entries */
export async function getBodyWeightLog(uid) {
  const ref = collection(db, 'users', uid, 'bodyWeight')
  const snap = await getDocs(ref)
  const entries = []
  snap.forEach((doc) => entries.push(doc.data()))
  return entries.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
}

/** Subscribe to body weight log */
export function subscribeToBodyWeight(uid, callback) {
  const ref = collection(db, 'users', uid, 'bodyWeight')
  return onSnapshot(ref, (snap) => {
    const entries = []
    snap.forEach((doc) => entries.push(doc.data()))
    entries.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    callback(entries)
  })
}


// ========================================
// SEED / INITIAL SETUP
// ========================================

/** Seed initial data for a new user (profile + plan) */
export async function seedDefaultData(uid, profile, plan) {
  const batch = writeBatch(db)

  // Profile
  const profileRef = doc(db, 'users', uid, 'profile', 'data')
  batch.set(profileRef, {
    ...profile,
    startDate: new Date().toISOString().split('T')[0],
    createdAt: serverTimestamp(),
  })

  // Plan
  const planRef = doc(db, 'users', uid, 'plan', 'data')
  batch.set(planRef, {
    ...plan,
    createdAt: serverTimestamp(),
  })

  // Queue — start at day1
  const queueRef = doc(db, 'users', uid, 'meta', 'queue')
  batch.set(queueRef, { currentDayKey: 'day1' })

  // Meta
  const metaRef = doc(db, 'users', uid, 'meta', 'seeded')
  batch.set(metaRef, { seededAt: serverTimestamp() })

  await batch.commit()
}


// ========================================
// QUEUE MANAGEMENT (Sequential Workout Order)
// ========================================

/** Get the current queue position (which day to show next) */
export async function getQueueIndex(uid) {
  const ref = doc(db, 'users', uid, 'meta', 'queue')
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : { currentDayKey: 'day1' }
}

/** Save the current queue position */
export async function saveQueueIndex(uid, dayKey) {
  const ref = doc(db, 'users', uid, 'meta', 'queue')
  await setDoc(ref, { currentDayKey: dayKey }, { merge: true })
}

/** Advance the queue to the next day in the cycle */
export async function advanceQueue(uid, plan) {
  const queue = await getQueueIndex(uid)
  const days = plan.days || []
  const currentIdx = days.findIndex(d => d.key === queue.currentDayKey)
  const nextIdx = (currentIdx + 1) % days.length
  const nextDayKey = days[nextIdx]?.key || 'day1'
  await saveQueueIndex(uid, nextDayKey)
  return nextDayKey
}


// ========================================
// PROGRESSIVE OVERLOAD (Plan Auto-Update)
// ========================================

/**
 * After completing a workout, compare the user's actual lifts against the plan
 * defaults and update the plan if the user went heavier or did more reps.
 * 
 * @param {string} uid - User ID
 * @param {object} plan - Current full plan object
 * @param {string} dayKey - Which day was completed (e.g. 'day1')
 * @param {Array} completedExercises - The exercises array from the completed session
 * @returns {object|null} Updated plan if changes were made, null otherwise
 */
export async function updatePlanFromSession(uid, plan, dayKey, completedExercises) {
  if (!plan || !completedExercises || completedExercises.length === 0) return null

  let planChanged = false
  const updatedDays = plan.days.map(day => {
    if (day.key !== dayKey) return day

    const updatedExercises = day.exercises.map(planEx => {
      const sessionEx = completedExercises.find(e => e.id === planEx.id)
      if (!sessionEx || !sessionEx.sets) return planEx

      // Find the heaviest weight and highest reps from done sets
      let maxWeight = 0
      let maxReps = 0
      let totalDoneSets = 0
      sessionEx.sets.forEach(set => {
        if (set.done) {
          totalDoneSets++
          const w = parseFloat(set.weight) || 0
          const r = parseInt(set.reps) || 0
          if (w > maxWeight) maxWeight = w
          if (r > maxReps) maxReps = r
        }
      })

      if (totalDoneSets === 0) return planEx

      const updated = { ...planEx }
      const currentDefaultWeight = parseFloat(planEx.defaultWeight) || 0

      // Update default weight if user lifted heavier
      if (maxWeight > currentDefaultWeight) {
        updated.defaultWeight = maxWeight
        planChanged = true
      }

      // Update default reps if user did more
      if (maxReps > (planEx.defaultReps || 0)) {
        updated.defaultReps = maxReps
        planChanged = true
      }

      // Update default sets if user did more sets
      if (totalDoneSets > (planEx.defaultSets || 3)) {
        updated.defaultSets = totalDoneSets
        planChanged = true
      }

      return updated
    })

    return { ...day, exercises: updatedExercises }
  })

  if (planChanged) {
    const updatedPlan = { ...plan, days: updatedDays }
    await savePlan(uid, updatedPlan)
    return updatedPlan
  }

  return null
}

