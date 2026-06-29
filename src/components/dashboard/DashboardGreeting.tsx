'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/providers/UserProvider'

function greetingFor(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Time-aware greeting heading. The name is known on the server, but the
 * time-of-day word resolves on mount (client-local time) to stay accurate
 * across timezones and avoid a hydration mismatch.
 */
export function DashboardGreeting() {
  const { user } = useUser()
  const [greeting, setGreeting] = useState<string | null>(null)

  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()))
    const id = setInterval(() => setGreeting(greetingFor(new Date().getHours())), 60_000)
    return () => clearInterval(id)
  }, [])

  const firstName = user?.full_name?.trim().split(/\s+/)[0] ?? null
  const lead = greeting ?? 'Hello'

  return (
    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
      <span suppressHydrationWarning>
        {lead}{firstName ? `, ${firstName}` : ''}
      </span>
      <span className="inline-block origin-[70%_70%] animate-[wave_2.2s_ease-in-out_infinite]">👋</span>
    </h1>
  )
}
