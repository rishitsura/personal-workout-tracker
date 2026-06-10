'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../lib/authContext'
import { Dumbbell, BarChart3, Calendar, Wifi } from 'lucide-react'

const FEATURES = [
  {
    icon: Calendar,
    title: "Today's Workout",
    desc: 'Auto-suggested daily split with set tracking',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    desc: 'Volume charts, streaks, and personal records',
  },
  {
    icon: Dumbbell,
    title: 'Plan Editor',
    desc: 'Customize your split — add, reorder, rename',
  },
  {
    icon: Wifi,
    title: 'Works Offline',
    desc: 'Install as an app. Train anywhere, sync later',
  },
]

export default function LandingPage() {
  const { user, loading, isNewUser, signIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      if (isNewUser) {
        router.replace('/onboarding')
      } else {
        router.replace('/today')
      }
    }
  }, [user, loading, isNewUser, router])

  const handleAuth = async () => {
    try {
      await signIn()
    } catch (err) {
      console.error('Sign in error:', err)
    }
  }

  // While checking auth, show loading
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-root">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin-slow" />
      </div>
    )
  }

  // If already logged in, show redirect spinner
  if (user) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-root">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin-slow" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-root flex flex-col">
      <div className="app-container flex flex-col min-h-dvh px-6">

        {/* Hero Section */}
        <div className="flex-1 flex flex-col justify-center items-center text-center pt-16 pb-8">
          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-amber-500 flex items-center justify-center mb-6 shadow-lg shadow-accent/20 animate-scale-pop">
            <Dumbbell className="w-10 h-10 text-root" strokeWidth={2.5} />
          </div>

          {/* Title */}
          <h1 className="font-display text-6xl tracking-wider text-txt-primary leading-none mb-3">
            IRON LOG
          </h1>

          {/* Tagline */}
          <p className="text-txt-secondary text-lg max-w-[280px] leading-relaxed">
            Track every rep. Crush every PR.
            <br />
            <span className="text-txt-muted text-base">Your gym journal, reimagined.</span>
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-3 mb-10 stagger-children">
          {FEATURES.map((feat) => (
            <div
              key={feat.title}
              className="bg-card rounded-xl p-4 border border-border-subtle hover:border-border-strong transition-colors duration-200"
            >
              <feat.icon className="w-5 h-5 text-accent mb-2.5" strokeWidth={2} />
              <h3 className="text-sm font-semibold text-txt-primary mb-1">{feat.title}</h3>
              <p className="text-xs text-txt-secondary leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="pb-10 space-y-3">
          {/* Sign Up — Primary */}
          <button
            id="signup-btn"
            onClick={handleAuth}
            className="w-full py-4 rounded-xl bg-accent text-root font-semibold text-base
                       hover:bg-accent-light active:scale-[0.98] transition-all duration-200
                       shadow-lg shadow-accent/20"
          >
            Sign Up — Get Started
          </button>

          {/* Sign In — Secondary */}
          <button
            id="signin-btn"
            onClick={handleAuth}
            className="w-full py-4 rounded-xl bg-card border border-border text-txt-primary font-medium text-base
                       hover:bg-card-secondary active:scale-[0.98] transition-all duration-200"
          >
            I already have an account
          </button>

          <p className="text-center text-xs text-txt-muted pt-1">
            Sign in with Google · No password needed
          </p>
        </div>
      </div>
    </div>
  )
}
