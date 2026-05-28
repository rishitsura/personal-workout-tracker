'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { auth, isFirebaseConfigured } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'

const AuthContext = createContext({
  user: null,
  loading: true,
  configured: false,
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const configured = isFirebaseConfigured()

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [configured])

  return (
    <AuthContext.Provider value={{ user, loading, configured }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
