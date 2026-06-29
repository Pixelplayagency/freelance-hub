'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

/**
 * Live date + time widget. Renders a stable placeholder on the server and
 * starts ticking once mounted on the client (avoids hydration mismatch).
 */
export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now
    ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : '--:--:--'
  const date = now
    ? now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    : ' '

  return (
    <div className="flex items-center gap-3 h-12 rounded-xl border border-border bg-card px-4 shadow-sm shrink-0">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
        <Clock className="w-4 h-4" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold text-foreground tabular-nums" suppressHydrationWarning>{time}</p>
        <p className="text-[11px] text-muted-foreground" suppressHydrationWarning>{date}</p>
      </div>
    </div>
  )
}
