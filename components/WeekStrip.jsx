'use client'

import { getWeekDays, getToday } from '../lib/utils'

export default function WeekStrip({ loggedDates = [], onDayClick }) {
  const today = getToday()
  const weekDays = getWeekDays(today)
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const loggedSet = new Set(loggedDates)

  return (
    <div className="flex items-center justify-between gap-1 px-1 py-3">
      {weekDays.map((dateStr, i) => {
        const isToday = dateStr === today
        const isLogged = loggedSet.has(dateStr)
        const isPast = dateStr < today

        return (
          <button
            key={dateStr}
            onClick={() => isLogged && onDayClick?.(dateStr)}
            disabled={!isLogged}
            className="flex flex-col items-center gap-1 flex-1"
          >
            <span className="text-[10px] text-txt-muted font-medium uppercase">{dayLabels[i]}</span>
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200
                ${isToday && isLogged
                  ? 'bg-accent text-root ring-2 ring-accent/30'
                  : isToday
                    ? 'bg-card-secondary text-accent ring-2 ring-accent/30'
                    : isLogged
                      ? 'bg-accent text-root'
                      : isPast
                        ? 'bg-transparent text-txt-muted'
                        : 'bg-transparent text-txt-faint'
                }`}
            >
              {parseInt(dateStr.split('-')[2])}
            </div>
          </button>
        )
      })}
    </div>
  )
}
