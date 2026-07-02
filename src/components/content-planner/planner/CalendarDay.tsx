'use client'

import { Plus } from 'lucide-react'
import { ContentCard } from './ContentCard'
import { toDateString, type EntryWithCreator } from './types'

interface CalendarDayProps {
  date: Date
  inMonth: boolean
  isToday: boolean
  entries: EntryWithCreator[]
  activeDate: string | null
  onSelectEntry: (entry: EntryWithCreator) => void
  onAddNew: (ds: string) => void
  readOnly?: boolean
}

export function CalendarDay({ date, inMonth, isToday, entries, activeDate, onSelectEntry, onAddNew, readOnly }: CalendarDayProps) {
  const ds = toDateString(date)
  const dayNum = date.getDate()

  return (
    <div
      className={`group/day relative flex flex-col min-h-[140px] rounded-xl border transition-colors ${
        !inMonth
          ? 'bg-muted/10 border-border/40'
          : isToday
          ? 'bg-primary/[0.04] border-primary/30'
          : 'bg-card border-border hover:border-border/70'
      }`}
    >
      {/* Day header */}
      <div className="flex items-center justify-between px-2.5 pt-2 pb-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`tabular-nums font-bold leading-none flex items-center justify-center ${
              isToday
                ? 'text-[10px] w-5 h-5 rounded-full bg-primary text-white'
                : inMonth
                ? 'text-xs text-foreground'
                : 'text-xs text-muted-foreground/40'
            }`}
          >
            {dayNum}
          </span>
          {isToday && (
            <span className="text-[9px] font-bold text-primary uppercase tracking-wide">Today</span>
          )}
        </div>
        {inMonth && !readOnly && (
          <button
            onClick={() => onAddNew(ds)}
            className="w-5 h-5 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted opacity-0 group-hover/day:opacity-100 transition-opacity"
            aria-label="Add content"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Entries */}
      <div className="flex-1 px-1.5 pb-1.5 space-y-1.5 overflow-hidden">
        {inMonth && entries.length === 0 && !readOnly && (
          <button
            onClick={() => onAddNew(ds)}
            className="w-full h-full min-h-[80px] rounded-lg border border-dashed border-border/50 flex items-center justify-center text-muted-foreground/30 hover:text-primary hover:border-primary/40 hover:bg-primary/[0.02] transition-all"
            aria-label="Add content"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
        {entries.map(entry => (
          <ContentCard
            key={entry.id}
            entry={entry}
            active={activeDate === ds}
            onClick={() => onSelectEntry(entry)}
          />
        ))}
      </div>
    </div>
  )
}
