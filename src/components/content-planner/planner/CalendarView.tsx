'use client'

import { CalendarDay } from './CalendarDay'
import { getCalendarWeeks, toDateString, type EntryWithCreator } from './types'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface CalendarViewProps {
  year: number
  month: number
  entryMap: Record<string, EntryWithCreator[]>
  activeDate: string | null
  onSelectEntry: (entry: EntryWithCreator) => void
  onAddNew: (ds: string) => void
}

export function CalendarView({ year, month, entryMap, activeDate, onSelectEntry, onAddNew }: CalendarViewProps) {
  const weeks = getCalendarWeeks(year, month)
  const todayDS = toDateString(new Date())

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-3 space-y-2">
      {/* Day header row — desktop only */}
      <div className="hidden md:grid grid-cols-7 gap-2 px-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center py-1.5">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-2">
        {weeks.map((week, wi) => {
          if (!week.some(d => d.getMonth() === month)) return null
          return (
            <div key={wi} className="grid grid-cols-1 md:grid-cols-7 gap-2">
              {week.map(day => {
                const ds = toDateString(day)
                return (
                  <CalendarDay
                    key={ds}
                    date={day}
                    inMonth={day.getMonth() === month}
                    isToday={ds === todayDS}
                    entries={entryMap[ds] ?? []}
                    activeDate={activeDate}
                    onSelectEntry={onSelectEntry}
                    onAddNew={onAddNew}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
