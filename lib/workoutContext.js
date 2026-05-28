'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './authContext'
import { db } from './firebase'
import { doc, setDoc, deleteDoc, onSnapshot, collection, writeBatch } from 'firebase/firestore'
import { getLogs as getLocalLogs, getProfile as getLocalProfile, getActiveSession as getLocalActiveSession } from './storage'

const WorkoutContext = createContext({
  logs: [],
  profile: null,
  activeSession: null,
  loading: true,
  saveLog: async () => {},
  deleteLog: async () => {},
  saveProfile: async () => {},
  saveActiveSession: async () => {},
})

export function WorkoutProvider({ children }) {
  const { user, configured } = useAuth()
  const [logs, setLogs] = useState([])
  const [profile, setProfile] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // Sync data
  useEffect(() => {
    // If not configured or no user logged in, use localStorage as fallback
    if (!configured || !user) {
      if (typeof window !== 'undefined') {
        const loadLocal = () => {
          setLogs(getLocalLogs())
          setProfile(getLocalProfile())
          setActiveSession(getLocalActiveSession())
          setLoading(false)
        }
        loadLocal()
        
        window.addEventListener('storage', loadLocal)
        return () => window.removeEventListener('storage', loadLocal)
      }
      setLoading(false)
      return
    }

    setLoading(true)
    const uid = user.uid

    // 1. Migrate local storage if not already done
    const performMigration = async () => {
      const migratedFlag = localStorage.getItem('wt_migrated_v3')
      if (migratedFlag === '1') return

      try {
        const batch = writeBatch(db)
        
        // Migrate profile
        const localProf = localStorage.getItem('wt_profile')
        let finalProfile = getLocalProfile()
        if (localProf) {
          try {
            finalProfile = JSON.parse(localProf)
          } catch {}
        }
        const userRef = doc(db, 'users', uid)
        batch.set(userRef, { profile: finalProfile, migrated: true }, { merge: true })

        // Migrate active session
        const localSess = localStorage.getItem('wt_active_session')
        if (localSess) {
          try {
            const session = JSON.parse(localSess)
            if (session) {
              const sessionRef = doc(db, 'users', uid, 'session', 'active')
              batch.set(sessionRef, session)
            }
          } catch {}
        }

        // Migrate logs
        const localLogsData = localStorage.getItem('wt_logs')
        if (localLogsData) {
          try {
            const localLogsList = JSON.parse(localLogsData)
            for (const log of localLogsList) {
              const logId = log.date.replace(/\//g, '-')
              const logRef = doc(db, 'users', uid, 'logs', logId)
              batch.set(logRef, log)
            }
          } catch {}
        }

        await batch.commit()
        localStorage.setItem('wt_migrated_v3', '1')
      } catch (err) {
        console.error("Migration to Firebase failed:", err)
      }
    }
    
    performMigration()

    // 2. Subscribe to Profile
    const unsubProfile = onSnapshot(doc(db, 'users', uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        setProfile(data.profile || getLocalProfile())
      } else {
        setProfile(getLocalProfile())
      }
    })

    // 3. Subscribe to Active Session
    const unsubSession = onSnapshot(doc(db, 'users', uid, 'session', 'active'), (snapshot) => {
      if (snapshot.exists()) {
        setActiveSession(snapshot.data())
      } else {
        setActiveSession(null)
      }
    })

    // 4. Subscribe to Logs
    const unsubLogs = onSnapshot(collection(db, 'users', uid, 'logs'), (snapshot) => {
      const logsList = []
      snapshot.forEach((doc) => {
        logsList.push(doc.data())
      })
      logsList.sort((a, b) => a.date.localeCompare(b.date))
      setLogs(logsList)
      setLoading(false)
    }, (error) => {
      console.error("Error loading logs from Firestore:", error)
      setLoading(false)
    })

    return () => {
      unsubProfile()
      unsubSession()
      unsubLogs()
    }
  }, [user, configured])

  // Context Actions
  const handleSaveLog = async (log) => {
    const logId = log.date.replace(/\//g, '-')
    if (configured && user) {
      await setDoc(doc(db, 'users', user.uid, 'logs', logId), log)
    } else {
      const currentLogs = getLocalLogs()
      const idx = currentLogs.findIndex((l) => l.date === log.date)
      if (idx >= 0) {
        currentLogs[idx] = log
      } else {
        currentLogs.push(log)
      }
      currentLogs.sort((a, b) => a.date.localeCompare(b.date))
      localStorage.setItem('wt_logs', JSON.stringify(currentLogs))
      setLogs(currentLogs)
    }
  }

  const handleDeleteLog = async (date) => {
    const logId = date.replace(/\//g, '-')
    if (configured && user) {
      await deleteDoc(doc(db, 'users', user.uid, 'logs', logId))
    } else {
      const currentLogs = getLocalLogs().filter((l) => l.date !== date)
      localStorage.setItem('wt_logs', JSON.stringify(currentLogs))
      setLogs(currentLogs)
    }
  }

  const handleSaveProfile = async (newProfile) => {
    if (configured && user) {
      await setDoc(doc(db, 'users', user.uid), { profile: newProfile }, { merge: true })
    } else {
      localStorage.setItem('wt_profile', JSON.stringify(newProfile))
      setProfile(newProfile)
    }
  }

  const handleSaveActiveSession = async (session) => {
    if (configured && user) {
      const activeRef = doc(db, 'users', user.uid, 'session', 'active')
      if (session === null) {
        await deleteDoc(activeRef)
      } else {
        await setDoc(activeRef, session)
      }
    } else {
      if (session === null) {
        localStorage.removeItem('wt_active_session')
      } else {
        localStorage.setItem('wt_active_session', JSON.stringify(session))
      }
      setActiveSession(session)
    }
  }

  return (
    <WorkoutContext.Provider
      value={{
        logs,
        profile,
        activeSession,
        loading,
        saveLog: handleSaveLog,
        deleteLog: handleDeleteLog,
        saveProfile: handleSaveProfile,
        saveActiveSession: handleSaveActiveSession,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  )
}

export const useWorkout = () => useContext(WorkoutContext)
