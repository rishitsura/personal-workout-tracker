import './globals.css'
import { AuthProvider } from '../lib/authContext'
import { WorkoutProvider } from '../lib/workoutContext'
import AppWrapper from '../components/AppWrapper'

export const metadata = {
  title: 'Iron Log',
  description: 'Your personal workout tracker — log workouts, track progress, crush PRs.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
}

export const viewport = {
  themeColor: '#050505',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <AuthProvider>
          <WorkoutProvider>
            <AppWrapper>{children}</AppWrapper>
          </WorkoutProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
