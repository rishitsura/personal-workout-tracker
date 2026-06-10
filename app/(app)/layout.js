'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/authContext'
import BottomNav from '../../components/BottomNav'

export default function AppLayout({ children }) {
  const { user, loading, isNewUser } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/')
    } else if (!loading && user && isNewUser) {
      router.replace('/onboarding')
    }
  }, [user, loading, isNewUser, router])

  // Don't render until mounted and authenticated
  if (!mounted || loading || !user || isNewUser) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-root">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin-slow" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-root flex flex-col">
      <div className="app-container flex-1 pb-[64px] safe-bottom flex flex-col relative">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
