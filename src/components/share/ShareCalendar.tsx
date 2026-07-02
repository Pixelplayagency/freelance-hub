'use client'

import { CalendarView } from '@/components/content-planner/planner/CalendarView'
import type { EntryWithCreator } from '@/components/content-planner/planner/types'

export function ShareCalendar({ year, month, entryMap }: { year: number; month: number; entryMap: Record<string, EntryWithCreator[]> }) {
  return (
    <CalendarView
      year={year}
      month={month}
      entryMap={entryMap}
      activeDate={null}
      onSelectEntry={() => {}}
      onAddNew={() => {}}
      readOnly
    />
  )
}
