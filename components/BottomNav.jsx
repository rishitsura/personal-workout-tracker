'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Calendar, Clock, Clipboard, User } from 'lucide-react'

const TABS = [
  { href: '/today', label: 'Today', icon: Calendar },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/plan', label: 'Plan', icon: Clipboard },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav
      id="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50 bg-root/95 backdrop-blur-md border-t border-border-subtle"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="app-container flex items-center justify-around h-[64px]">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <button
              key={href}
              id={`nav-${label.toLowerCase()}`}
              onClick={() => router.push(href)}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 py-1 transition-colors duration-200
                ${isActive ? 'text-accent' : 'text-txt-muted hover:text-txt-secondary'}`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`text-[10px] leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
