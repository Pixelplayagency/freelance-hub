'use client'

import { useState } from 'react'
import { CalendarView } from '@/components/content-planner/planner/CalendarView'
import { ShareContentModal } from './ShareContentModal'
import type { EntryWithCreator } from '@/components/content-planner/planner/types'

export function ShareCalendar({ year, month, entryMap }: { year: number; month: number; entryMap: Record<string, EntryWithCreator[]> }) {
  const [selected, setSelected] = useState<EntryWithCreator | null>(null)

  return (
    <>
      <CalendarView
        year={year}
        month={month}
        entryMap={entryMap}
        activeDate={null}
        onSelectEntry={setSelected}
        onAddNew={() => {}}
        readOnly
      />
      <ShareContentModal entry={selected} onClose={() => setSelected(null)} />
    </>
  )
}
