'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  {
    href: '/',
    label: 'Today',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#f97316' : '#555'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'History',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#f97316' : '#555'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v5h5" />
        <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
        <path d="M12 7v5l4 2" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? '#f97316' : '#555'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(5,5,5,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid #141414',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '12px 0 10px',
                textDecoration: 'none',
                color: active ? '#f97316' : '#4a4a4a',
                position: 'relative',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '48px',
                justifyContent: 'center',
              }}
            >
              {/* Active indicator line */}
              {active && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '24px',
                    height: '2px',
                    background: '#f97316',
                    borderRadius: '0 0 2px 2px',
                  }}
                />
              )}
              {icon(active)}
              <span
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.06em',
                  fontWeight: active ? 700 : 500,
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
