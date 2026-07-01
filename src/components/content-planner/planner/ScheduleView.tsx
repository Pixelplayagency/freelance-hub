'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import type { ContentType } from '@/lib/types/app.types'
import { ContentTypeChip } from './ContentTypeChip'
import { StatusBadge } from './StatusBadge'
import {
  CONTENT_TYPE_META, getCalendarWeeks, to12h, toDateString, type EntryWithCreator,
} from './types'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const CONTENT_TYPES: ContentType[] = ['post', 'reel', 'story']

interface ScheduleViewProps {
  year: number
  month: number
  entryMap: Record<string, EntryWithCreator[]>
  activeDate: string | null
  onSelectEntry: (entry: EntryWithCreator) => void
  onAddNew: (ds: string, type: ContentType) => void
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
                      {inMonth && entries.length > 0 && (
                        <TypePickerButton
                          className="w-5 h-5 opacity-0 group-hover/day:opacity-100 text-muted-foreground/50 hover:text-foreground hover:bg-muted"
                          onSelect={type => onAddNew(ds, type)}
                        />
                      )}
                    </div>

                    <div className="flex-1 px-1.5 pb-1.5 space-y-1">
                      {inMonth && entries.length === 0 && (
                        <TypePickerButton
                          className="w-full h-full min-h-[56px] border border-dashed border-border/50 text-muted-foreground/30 hover:text-primary hover:border-primary/40 hover:bg-primary/[0.02]"
                          onSelect={type => onAddNew(ds, type)}
                          large
                        />
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

function TypePickerButton({ onSelect, className = '', large = false }: { onSelect: (type: ContentType) => void; className?: string; large?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center justify-center transition-all ${large ? 'rounded-lg' : 'rounded-md'} ${className}`}
        aria-label="Add content"
      >
        <Plus className={large ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
      </button>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-30 bg-card border border-border rounded-lg shadow-lg py-1 w-28">
          {CONTENT_TYPES.map(t => {
            const meta = CONTENT_TYPE_META[t]
            return (
              <button
                key={t}
                type="button"
                onClick={() => { onSelect(t); setOpen(false) }}
                className="w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors"
                style={{ color: meta.color }}
              >
                {meta.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ScheduleRow({ entry, active, onClick }: { entry: EntryWithCreator; active: boolean; onClick: () => void }) {
  const meta = CONTENT_TYPE_META[entry.content_type]

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg border px-2 py-1.5 transition-all hover:shadow-sm space-y-1 ${
        active ? 'border-primary ring-1 ring-primary/30' : 'border-border/60 hover:border-border'
      }`}
      style={{ backgroundColor: meta.bgVar }}
    >
      <div className="flex items-center justify-between gap-1">
        <ContentTypeChip type={entry.content_type} size="xs" />
        {entry.scheduled_time && (
          <span className="text-[9px] font-semibold text-foreground/70 tabular-nums leading-none shrink-0">
            {to12h(entry.scheduled_time)}
          </span>
        )}
      </div>
      {entry.tbc && (
        <p className="text-[10px] text-foreground/70 leading-tight line-clamp-2">{entry.tbc}</p>
      )}
      <StatusBadge entry={entry} size="xs" />
    </button>
  )
}
