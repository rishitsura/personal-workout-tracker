'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { auth, isFirebaseConfigured, googleProvider, signInWithPopup, signOut } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { checkUserExists } from './firestoreService'

const AuthContext = createContext({
  user: null,
  loading: true,
  isNewUser: false,
  signIn: async () => {},
  logOut: async () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)
  const configured = isFirebaseConfigured()

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // Check if user already has a profile in Firestore
        try {
          const exists = await checkUserExists(firebaseUser.uid)
          setIsNewUser(!exists)
        } catch (err) {
          console.error('Error checking user existence:', err)
          setIsNewUser(false)
        }
      } else {
        setUser(null)
        setIsNewUser(false)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [configured])

  const signIn = useCallback(async () => {
    if (!configured) return
    try {
      const result = await signInWithPopup(auth, googleProvider)
      // The onAuthStateChanged will handle the rest
      return result
    } catch (err) {
      // Don't throw on popup close
      if (err.code === 'auth/popup-closed-by-user') return null
      if (err.code === 'auth/cancelled-popup-request') return null
      throw err
    }
  }, [configured])

  const logOut = useCallback(async () => {
    if (!configured) return
    await signOut(auth)
  }, [configured])

  return (
    <AuthContext.Provider value={{ user, loading, isNewUser, setIsNewUser, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
