'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, ChevronDown, Check } from 'lucide-react'
import type { ContentPlanStatus, ContentType } from '@/lib/types/app.types'
import {
  CONTENT_TYPE_META, STATUS_CFG, getCalendarWeeks, to12h, toDateString, type EntryWithCreator,
} from './types'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const CONTENT_TYPES: ContentType[] = ['post', 'reel', 'story']
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = [0, 15, 30, 45]

type QuickPatch = Partial<{ content_type: ContentType; scheduled_time: string | null; status: ContentPlanStatus }>

interface ScheduleViewProps {
  year: number
  month: number
  entryMap: Record<string, EntryWithCreator[]>
  activeDate: string | null
  onSelectEntry: (entry: EntryWithCreator) => void
  onAddNew: (ds: string, type: ContentType) => void
  onQuickUpdate: (id: string, patch: QuickPatch) => void
}

export function ScheduleView({ year, month, entryMap, activeDate, onSelectEntry, onAddNew, onQuickUpdate }: ScheduleViewProps) {
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
                          className="w-5 h-5 opacity-0 group-hover/day:opacity-100"
                          onSelect={type => onAddNew(ds, type)}
                        />
                      )}
                    </div>

                    <div className="flex-1 px-1.5 pb-1.5 space-y-1 overflow-hidden">
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
                          onQuickUpdate={onQuickUpdate}
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
        className={`rounded-md flex items-center justify-center transition-all ${large ? 'rounded-lg' : 'rounded-md'} ${className}`}
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

function ScheduleRow({
  entry, active, onClick, onQuickUpdate,
}: {
  entry: EntryWithCreator
  active: boolean
  onClick: () => void
  onQuickUpdate: (id: string, patch: QuickPatch) => void
}) {
  const meta = CONTENT_TYPE_META[entry.content_type]
  const statusCfg = STATUS_CFG.find(s => s.key === entry.status) ?? STATUS_CFG[0]

  return (
    <div
      onClick={onClick}
      className={`w-full text-left rounded-lg border cursor-pointer px-1.5 py-1.5 transition-all hover:shadow-sm space-y-1 ${
        active ? 'border-primary ring-1 ring-primary/30' : 'border-border/60 hover:border-border'
      }`}
      style={{ backgroundColor: meta.bgVar }}
    >
      {entry.tbc && (
        <p className="text-[10px] text-foreground/70 leading-tight line-clamp-2 px-0.5">{entry.tbc}</p>
      )}

      <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
        {/* Content type dropdown */}
        <select
          value={entry.content_type}
          onChange={e => onQuickUpdate(entry.id, { content_type: e.target.value as ContentType })}
          className="w-full text-[9px] font-bold rounded-md border border-border/60 bg-background px-1.5 py-1 cursor-pointer"
          style={{ color: meta.color }}
        >
          {CONTENT_TYPES.map(t => (
            <option key={t} value={t}>{CONTENT_TYPE_META[t].label}</option>
          ))}
        </select>

        {/* Time dropdown with embedded confirm */}
        <TimeDropdown time={entry.scheduled_time ?? ''} onChange={t => onQuickUpdate(entry.id, { scheduled_time: t })} />

        {/* Status dropdown */}
        <select
          value={entry.status}
          onChange={e => onQuickUpdate(entry.id, { status: e.target.value as ContentPlanStatus })}
          className="w-full text-[9px] font-semibold rounded-md border border-border/60 bg-background px-1.5 py-1 cursor-pointer"
          style={{ color: statusCfg.color }}
        >
          {STATUS_CFG.map(s => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

function TimeDropdown({ time, onChange }: { time: string; onChange: (t: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const parsed = time ? (() => {
    const [h, m] = time.split(':').map(Number)
    return { hour: h % 12 || 12, minute: m, ampm: (h >= 12 ? 'PM' : 'AM') as 'AM' | 'PM' }
  })() : { hour: 9, minute: 0, ampm: 'AM' as 'AM' | 'PM' }

  const [hour, setHour] = useState(parsed.hour)
  const [minute, setMinute] = useState(parsed.minute)
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(parsed.ampm)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function confirm() {
    let h24 = hour % 12
    if (ampm === 'PM') h24 += 12
    onChange(`${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-1 px-1.5 py-1 rounded-md border border-border/60 bg-background text-[9px] font-semibold text-foreground/80 hover:border-border transition-colors"
      >
        <span className="tabular-nums">{time ? to12h(time) : 'Set time'}</span>
        <ChevronDown className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-card border border-border rounded-lg shadow-lg p-1.5 flex items-center gap-1 w-max">
          <select value={hour} onChange={e => setHour(Number(e.target.value))} className="text-[10px] rounded border border-border px-1 py-0.5 bg-background">
            {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <select value={minute} onChange={e => setMinute(Number(e.target.value))} className="text-[10px] rounded border border-border px-1 py-0.5 bg-background">
            {MINUTES.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
          </select>
          <select value={ampm} onChange={e => setAmpm(e.target.value as 'AM' | 'PM')} className="text-[10px] rounded border border-border px-1 py-0.5 bg-background">
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
          <button
            type="button"
            onClick={confirm}
            className="w-6 h-6 rounded-md text-white flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--primary)' }}
            aria-label="Confirm time"
          >
            <Check className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}
