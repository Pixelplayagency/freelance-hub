'use client'

import { useEffect, useState } from 'react'
import { parseISO, differenceInSeconds, differenceInDays, differenceInHours, isPast, format } from 'date-fns'
import { cn } from '@/lib/utils/cn'

interface DeadlineProgressProps {
  createdAt: string
  dueDate: string
}

export function DeadlineProgress({ createdAt, dueDate }: DeadlineProgressProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const start = parseISO(createdAt)
  const end = parseISO(dueDate)
  const totalSecs = differenceInSeconds(end, start)
  const elapsedSecs = differenceInSeconds(now, start)
  const pct = Math.min(100, Math.max(0, totalSecs > 0 ? (elapsedSecs / totalSecs) * 100 : 100))

  const overdue = isPast(end)
  const daysLeft = differenceInDays(end, now)
  const hoursLeft = differenceInHours(end, now)
  const daysOver = differenceInDays(now, end)

  let statusText: string
  let statusColor: string
  if (overdue) {
    statusText = `${daysOver} day${daysOver !== 1 ? 's' : ''} overdue`
    statusColor = 'text-red-500'
  } else if (daysLeft === 0) {
    statusText = hoursLeft <= 0 ? 'Due now' : `${hoursLeft}h left`
    statusColor = 'text-amber-500'
  } else if (daysLeft === 1) {
    statusText = '1 day left'
    statusColor = 'text-amber-500'
  } else {
    statusText = `${daysLeft} days left`
    statusColor = 'text-gray-500'
  }

  const barColor = overdue ? '#f24a49' : pct > 80 ? '#f59e0b' : pct > 50 ? '#f59e0b' : '#22c55e'

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-gray-400">
          <span>{format(start, 'MMM d')}</span>
          <span className="text-gray-200">→</span>
          <span>{format(end, 'MMM d, yyyy')}</span>
        </div>
        <span className={cn('font-semibold', statusColor)}>{statusText}</span>
      </div>

      {/* Bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>

      {/* % label */}
      <div className="flex justify-end">
        <span className="text-[10px] text-gray-400">{Math.round(pct)}% of timeline used</span>
      </div>
    </div>
  )
}
