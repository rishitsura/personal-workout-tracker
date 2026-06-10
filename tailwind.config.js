/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Bebas Neue', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        root: '#0a0a0a',
        card: {
          DEFAULT: '#111111',
          secondary: '#1a1a1a',
        },
        border: {
          DEFAULT: '#1e1e1e',
          subtle: '#161616',
          strong: '#2a2a2a',
        },
        txt: {
          primary: '#f5f5f5',
          secondary: '#888888',
          muted: '#4a4a4a',
          faint: '#2e2e2e',
        },
        accent: {
          DEFAULT: '#f97316',
          light: '#fb923c',
          dim: 'rgba(249, 115, 22, 0.10)',
          glow: 'rgba(249, 115, 22, 0.25)',
          border: 'rgba(249, 115, 22, 0.30)',
        },
        success: {
          DEFAULT: '#22c55e',
          dim: 'rgba(34, 197, 94, 0.10)',
          border: 'rgba(34, 197, 94, 0.25)',
        },
        danger: {
          DEFAULT: '#ef4444',
          dim: 'rgba(239, 68, 68, 0.10)',
          border: 'rgba(239, 68, 68, 0.25)',
        },
        info: {
          DEFAULT: '#3b82f6',
          dim: 'rgba(59, 130, 246, 0.10)',
        },
        day: {
          1: '#f97316',
          2: '#3b82f6',
          3: '#10b981',
          4: '#ef4444',
          5: '#8b5cf6',
          6: '#ec4899',
        },
      },
      maxWidth: {
        app: '480px',
      },
      spacing: {
        'safe-bottom': 'calc(76px + env(safe-area-inset-bottom, 0px))',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'scale-pop': 'scalePop 0.2s ease-out',
        'check-pop': 'checkPop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shimmer': 'shimmer 1.5s infinite',
        'spin-slow': 'spin 0.8s linear infinite',
        'pulse-slow': 'pulse 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'toast-in': 'toastIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scalePop: {
          '0%': { transform: 'scale(0.92)', opacity: '0' },
          '60%': { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        checkPop: {
          '0%': { transform: 'scale(0.6)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(249, 115, 22, 0.25)' },
          '50%': { boxShadow: '0 0 20px rgba(249, 115, 22, 0.25)' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translateX(-50%) translateY(12px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateX(-50%) translateY(0) scale(1)' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(-60px) rotate(360deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
