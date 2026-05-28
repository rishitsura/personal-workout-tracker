'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../lib/authContext'
import LoginPage from './LoginPage'

export default function AppWrapper({ children }) {
  const { user, loading } = useAuth()
  const [isDemoMode, setIsDemoMode] = useState(false)

  // Load demo mode state from local storage so it persists across refreshes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const demo = localStorage.getItem('wt_demo_mode')
      if (demo === '1') {
        setIsDemoMode(true)
      }
    }
  }, [])

  function handleDemoMode() {
    setIsDemoMode(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('wt_demo_mode', '1')
    }
  }

  // Clear demo mode if user logs in
  useEffect(() => {
    if (user && isDemoMode) {
      setIsDemoMode(false)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('wt_demo_mode')
      }
    }
  }, [user, isDemoMode])

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          border: '2.5px solid rgba(255,255,255,0.05)', borderTopColor: '#f97316',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  if (!user && !isDemoMode) {
    return <LoginPage onDemoMode={handleDemoMode} />
  }

  return <>{children}</>
}
