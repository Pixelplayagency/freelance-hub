'use client'

import { Plus } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import {
  CONTENT_TYPE_META, getCalendarWeeks, to12h, toDateString, type EntryWithCreator,
} from './types'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface ScheduleViewProps {
  year: number
  month: number
  entryMap: Record<string, EntryWithCreator[]>
  activeDate: string | null
  onSelectEntry: (entry: EntryWithCreator) => void
  onAddNew: (ds: string) => void
}

export function ScheduleView({ year, month, entryMap, activeDate, onSelectEntry, onAddNew }: ScheduleViewProps) {
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

      <div className="space-y-2">
        {weeks.map((week, wi) => {
          if (!week.some(d => d.getMonth() === month)) return null
          return (
            <div key={wi} className="grid grid-cols-1 md:grid-cols-7 gap-2">
              {week.map(day => {
                const ds = toDateString(day)
                const inMonth = day.getMonth() === month
                const isToday = ds === todayDS
                const entries = entryMap[ds] ?? []
                return (
                  <div
                    key={ds}
                    className={`group/day relative flex flex-col min-h-[110px] rounded-xl border transition-colors ${
                      !inMonth
                        ? 'bg-muted/10 border-border/40'
                        : isToday
                        ? 'bg-primary/[0.04] border-primary/30'
                        : 'bg-card border-border hover:border-border/70'
                    }`}
                  >
                    <div className="flex items-center justify-between px-2.5 pt-2 pb-1 shrink-0">
                      <span
                        className={`tabular-nums font-bold leading-none flex items-center justify-center ${
                          isToday
                            ? 'text-[10px] w-5 h-5 rounded-full bg-primary text-white'
                            : inMonth
                            ? 'text-xs text-foreground'
                            : 'text-xs text-muted-foreground/40'
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      {inMonth && (
                        <button
                          onClick={() => onAddNew(ds)}
                          className="w-5 h-5 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted opacity-0 group-hover/day:opacity-100 transition-opacity"
                          aria-label="Add content"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 px-1.5 pb-1.5 space-y-1 overflow-hidden">
                      {inMonth && entries.length === 0 && (
                        <button
                          onClick={() => onAddNew(ds)}
                          className="w-full h-full min-h-[56px] rounded-lg border border-dashed border-border/50 flex items-center justify-center text-muted-foreground/30 hover:text-primary hover:border-primary/40 hover:bg-primary/[0.02] transition-all"
                          aria-label="Add content"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {entries.map(entry => (
                        <ScheduleRow
                          key={entry.id}
                          entry={entry}
                          active={activeDate === ds}
                          onClick={() => onSelectEntry(entry)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ScheduleRow({ entry, active, onClick }: { entry: EntryWithCreator; active: boolean; onClick: () => void }) {
  const meta = CONTENT_TYPE_META[entry.content_type]

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border px-2 py-1.5 transition-all hover:shadow-sm ${
        active ? 'border-primary ring-1 ring-primary/30' : 'border-border/60 hover:border-border'
      }`}
      style={{ backgroundColor: meta.bgVar }}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-bold leading-none" style={{ color: meta.color }}>{meta.label}</span>
        {entry.scheduled_time && (
          <span className="text-[9px] font-semibold text-foreground/70 tabular-nums leading-none">
            {to12h(entry.scheduled_time)}
          </span>
        )}
      </div>
      {entry.tbc && (
        <p className="text-[10px] text-foreground/70 leading-tight mt-1 line-clamp-2">{entry.tbc}</p>
      )}
      <div className="mt-1">
        <StatusBadge entry={entry} size="xs" />
      </div>
    </button>
  )
}
