'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function BottomSheet({ isOpen, onClose, title, children }) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 animate-slide-up">
        <div className="app-container">
          <div className="bg-card rounded-t-2xl border border-border-subtle border-b-0 max-h-[80dvh] flex flex-col">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-border-strong rounded-full" />
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 py-3">
                <h3 className="font-display text-xl tracking-wider">{title}</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-card-secondary flex items-center justify-center text-txt-muted hover:text-txt-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="px-5 pb-8 overflow-y-auto" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
