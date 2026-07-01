'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, ChevronDown, Check, Trash2, Clock } from 'lucide-react'
import type { ContentPlanStatus, ScheduleContentType, ScheduleEntry } from '@/lib/types/app.types'
import { PLATFORMS, SCHEDULE_TYPE_META, getCalendarWeeks, to12h, toDateString } from './types'
import { PlatformIcon } from './PlatformIcon'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SCHEDULE_CONTENT_TYPES: ScheduleContentType[] = ['post', 'reel', 'story', 'none']
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = [0, 15, 30, 45]

type SchedulePatch = Partial<{ content_type: ScheduleContentType; scheduled_time: string | null; status: ContentPlanStatus; platforms: string[] }>

interface ScheduleViewProps {
  year: number
  month: number
  entryMap: Record<string, ScheduleEntry[]>
  onCreate: (date: string, type: ScheduleContentType) => void
  onUpdate: (id: string, patch: SchedulePatch) => void
  onDelete: (id: string) => void
  readOnly?: boolean
}

export function ScheduleView({ year, month, entryMap, onCreate, onUpdate, onDelete, readOnly = false }: ScheduleViewProps) {
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
                      {!readOnly && inMonth && entries.length > 0 && (
                        <TypePickerButton
                          className="w-5 h-5 rounded-md border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5"
                          onSelect={type => onCreate(ds, type)}
                        />
                      )}
                    </div>

                    <div className="flex-1 px-1.5 pb-1.5 space-y-1">
                      {!readOnly && inMonth && entries.length === 0 && (
                        <TypePickerButton
                          className="w-full h-full min-h-[56px] border border-dashed border-border text-muted-foreground/70 hover:text-primary hover:border-primary/40 hover:bg-primary/[0.02]"
                          onSelect={type => onCreate(ds, type)}
                          large
                        />
                      )}
                      {entries.map(entry => (
                        <ScheduleCard
                          key={entry.id}
                          entry={entry}
                          onUpdate={patch => onUpdate(entry.id, patch)}
                          onDelete={() => onDelete(entry.id)}
                          readOnly={readOnly}
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

function TypePickerButton({ onSelect, className = '', large = false }: { onSelect: (type: ScheduleContentType) => void; className?: string; large?: boolean }) {
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
          {SCHEDULE_CONTENT_TYPES.map(t => {
            const meta = SCHEDULE_TYPE_META[t]
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

function ScheduleCard({
  entry, onUpdate, onDelete, readOnly,
}: {
  entry: ScheduleEntry
  onUpdate: (patch: SchedulePatch) => void
  onDelete: () => void
  readOnly?: boolean
}) {
  const meta = SCHEDULE_TYPE_META[entry.content_type]
  const platforms = entry.platforms ?? []

  if (readOnly) {
    return (
      <div className="rounded-lg border border-border/60 px-1.5 py-1.5 space-y-1" style={{ backgroundColor: meta.bgVar }}>
        <div className="flex items-center justify-between gap-1 px-0.5">
          <span className="text-[10px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-foreground/70 tabular-nums">
            <Clock className="w-2.5 h-2.5" />
            {entry.scheduled_time ? to12h(entry.scheduled_time) : 'No time set'}
          </span>
        </div>
        {platforms.length > 0 && (
          <div className="flex items-center gap-1 px-0.5">
            {platforms.map(p => <PlatformIcon key={p} platform={p} size={11} />)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="group/card relative rounded-lg border border-border/60 hover:border-border px-1.5 py-1.5 space-y-1 transition-all" style={{ backgroundColor: meta.bgVar }}>
      <button
        type="button"
        onClick={onDelete}
        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-card border border-border text-muted-foreground/60 hover:text-red-600 hover:border-red-300 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center"
        aria-label="Remove"
      >
        <Trash2 className="w-2.5 h-2.5" />
      </button>

      {/* Type row */}
      <TypeInlinePicker type={entry.content_type} onSelect={t => onUpdate({ content_type: t })} />

      {/* Time row */}
      <TimeInlinePicker time={entry.scheduled_time ?? ''} onChange={t => onUpdate({ scheduled_time: t })} />

      {/* Platforms row */}
      <PlatformsRow platforms={platforms} onToggle={p => {
        const next = platforms.includes(p) ? platforms.filter(x => x !== p) : [...platforms, p]
        onUpdate({ platforms: next })
      }} />
    </div>
  )
}

function TypeInlinePicker({ type, onSelect }: { type: ScheduleContentType; onSelect: (t: ScheduleContentType) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const meta = SCHEDULE_TYPE_META[type]

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-1 px-1.5 py-1 rounded-md bg-background/70 text-[10px] font-bold transition-colors hover:bg-background"
        style={{ color: meta.color }}
      >
        <span>{meta.label}</span>
        <ChevronDown className="w-2.5 h-2.5 shrink-0 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-card border border-border rounded-lg shadow-lg py-1 w-28">
          {SCHEDULE_CONTENT_TYPES.map(t => {
            const m = SCHEDULE_TYPE_META[t]
            return (
              <button
                key={t}
                type="button"
                onClick={() => { onSelect(t); setOpen(false) }}
                className="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold hover:bg-muted transition-colors"
                style={{ color: m.color }}
              >
                {m.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PlatformsRow({ platforms, onToggle }: { platforms: string[]; onToggle: (p: string) => void }) {
  return (
    <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-md bg-background/70">
      {PLATFORMS.map(p => {
        const active = platforms.includes(p.id)
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onToggle(p.id)}
            className={`transition-opacity ${active ? 'opacity-100' : 'opacity-25 hover:opacity-60'}`}
            aria-label={p.label}
            aria-pressed={active}
          >
            <PlatformIcon platform={p.id} size={12} />
          </button>
        )
      })}
    </div>
  )
}

function TimeInlinePicker({ time, onChange }: { time: string; onChange: (t: string) => void }) {
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
        className="w-full flex items-center justify-between gap-1 px-1.5 py-1 rounded-md bg-background/70 text-[10px] font-semibold text-foreground/70 transition-colors hover:bg-background"
      >
        <span className="tabular-nums">{time ? to12h(time) : 'Set time'}</span>
        <ChevronDown className="w-2.5 h-2.5 shrink-0 opacity-60" />
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
