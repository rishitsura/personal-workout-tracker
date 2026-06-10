'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

// Simple global event emitter for toasts
const toastEventEmitter = {
  listeners: [],
  emit(toast) {
    this.listeners.forEach(l => l(toast))
  },
  subscribe(listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }
}

export const toast = {
  success: (message) => toastEventEmitter.emit({ type: 'success', message }),
  error: (message) => toastEventEmitter.emit({ type: 'error', message }),
  info: (message) => toastEventEmitter.emit({ type: 'info', message }),
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    return toastEventEmitter.subscribe((toast) => {
      const id = Date.now()
      setToasts(prev => [...prev, { ...toast, id }])
      
      // Auto dismiss
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 3000)
    })
  }, [])

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-[100px] left-0 right-0 z-[100] pointer-events-none flex flex-col items-center gap-2 px-4">
      {toasts.map(t => {
        let Icon = Info
        let bgClass = 'bg-info text-root'
        
        if (t.type === 'success') {
          Icon = CheckCircle2
          bgClass = 'bg-success text-root'
        } else if (t.type === 'error') {
          Icon = AlertCircle
          bgClass = 'bg-danger text-root'
        }

        return (
          <div 
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg animate-toast ${bgClass}`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-semibold">{t.message}</span>
            <button 
              onClick={() => removeToast(t.id)}
              className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
