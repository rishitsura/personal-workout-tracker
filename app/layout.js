import './globals.css'

export const metadata = {
  title: 'Iron Log',
  description: 'Your personal workout tracker',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
}

export const viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "'DM Sans', sans-serif" }}>{children}</body>
    </html>
  )
}
