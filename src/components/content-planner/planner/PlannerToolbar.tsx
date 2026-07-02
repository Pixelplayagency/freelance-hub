'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, Search, Filter, X, CalendarDays, Grid3x3, ListChecks } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { PlatformIcon } from './PlatformIcon'
import type { PlannerFilters, FilterPlatform, FilterStatus, FilterType } from './types'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

const PLATFORM_OPTIONS: { id: FilterPlatform; label: string }[] = [
  { id: 'all', label: 'All platforms' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'linkedin', label: 'LinkedIn' },
]

const STATUS_OPTIONS: { id: FilterStatus; label: string; dot: string }[] = [
  { id: 'all',         label: 'All statuses', dot: '#94a3b8' },
  { id: 'scheduled',   label: 'Scheduled',    dot: '#2563eb' },
  { id: 'in_review',   label: 'In review',    dot: '#d97706' },
  { id: 'approved',    label: 'Approved',     dot: '#059669' },
  { id: 'rejected',    label: 'Rejected',     dot: '#dc2626' },
  { id: 'published',   label: 'Published',    dot: '#059669' },
  { id: 'not_posted',  label: 'Pending',      dot: '#f59e0b' },
]

const TYPE_OPTIONS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All types' },
  { id: 'post', label: 'Posts' },
  { id: 'reel', label: 'Reels' },
  { id: 'story', label: 'Stories' },
]

interface PlannerToolbarProps {
  year: number
  month: number
  basePath: string
  filters: PlannerFilters
  onFilterChange: (next: PlannerFilters) => void
  onAddNew: () => void
  totalCount: number
  filteredCount: number
  view: 'calendar' | 'preview' | 'schedule'
  onViewChange: (v: 'calendar' | 'preview' | 'schedule') => void
}

export function PlannerToolbar({
  year, month, basePath, filters, onFilterChange, onAddNew, totalCount, filteredCount, view, onViewChange,
}: PlannerToolbarProps) {
  const router = useRouter()

  function navigate(dir: -1 | 1) {
    let m = month + dir, y = year
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    const sep = basePath.includes('?') ? '&' : '?'
    router.push(`${basePath}${sep}month=${m}&year=${y}`)
  }

  function jumpToday() {
    const now = new Date()
    const sep = basePath.includes('?') ? '&' : '?'
    router.push(`${basePath}${sep}month=${now.getMonth()}&year=${now.getFullYear()}`)
  }

  const hasFilters =
    filters.search.trim() !== '' ||
    filters.platform !== 'all' ||
    filters.status !== 'all' ||
    filters.type !== 'all'

  function clearFilters() {
    onFilterChange({ search: '', platform: 'all', status: 'all', type: 'all' })
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3">
      {/* Top row: month nav + add new */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg border border-border bg-background hover:bg-muted transition-colors flex items-center justify-center"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(1)}
            className="w-8 h-8 rounded-lg border border-border bg-background hover:bg-muted transition-colors flex items-center justify-center"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={jumpToday}
            className="text-xs font-semibold px-3 h-8 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
          >
            Today
          </button>
        </div>

        <h2 className="text-base font-bold tracking-tight text-foreground tabular-nums ml-1">
          {MONTH_NAMES[month]} <span className="text-muted-foreground font-medium">{year}</span>
        </h2>

        <div className="flex-1" />

        <div className="inline-flex items-center rounded-lg border border-border bg-background p-0.5">
          <button
            onClick={() => onViewChange('calendar')}
            className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-semibold transition-colors ${
              view === 'calendar' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Calendar
          </button>
          <button
            onClick={() => onViewChange('schedule')}
            className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-semibold transition-colors ${
              view === 'schedule' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            Schedule
          </button>
          <button
            onClick={() => onViewChange('preview')}
            className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-semibold transition-colors ${
              view === 'preview' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Grid3x3 className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>

        <button
          onClick={onAddNew}
          className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-lg text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          <Plus className="w-3.5 h-3.5" />
          New content
        </button>
      </div>

      {/* Bottom row: search + filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search captions…"
            value={filters.search}
            onChange={e => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>

        {/* Platform */}
        <FilterDropdown
          label="Platform"
          value={filters.platform}
          options={PLATFORM_OPTIONS.map(o => ({
            id: o.id,
            label: o.label,
            leading: o.id !== 'all' ? <PlatformIcon platform={o.id} size={12} /> : null,
          }))}
          onChange={v => onFilterChange({ ...filters, platform: v as FilterPlatform })}
        />

        {/* Status */}
        <FilterDropdown
          label="Status"
          value={filters.status}
          options={STATUS_OPTIONS.map(o => ({
            id: o.id,
            label: o.label,
            leading: <span className="w-2 h-2 rounded-full" style={{ backgroundColor: o.dot }} />,
          }))}
          onChange={v => onFilterChange({ ...filters, status: v as FilterStatus })}
        />

        {/* Type */}
        <FilterDropdown
          label="Type"
          value={filters.type}
          options={TYPE_OPTIONS.map(o => ({ id: o.id, label: o.label }))}
          onChange={v => onFilterChange({ ...filters, type: v as FilterType })}
        />

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-2 h-8 rounded-lg border border-border bg-background hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}

        {hasFilters && (
          <span className="text-[11px] text-muted-foreground tabular-nums ml-auto">
            {filteredCount} of {totalCount}
          </span>
        )}
      </div>
    </div>
  )
}

interface FilterOption {
  id: string
  label: string
  leading?: React.ReactNode
}

function FilterDropdown({
  label, value, options, onChange,
}: {
  label: string
  value: string
  options: FilterOption[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = options.find(o => o.id === value)
  const isAll = value === 'all'

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-medium transition-all ${
          isAll
            ? 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
            : 'border-primary/30 bg-primary/[0.04] text-foreground'
        }`}
      >
        <Filter className="w-3 h-3" />
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-semibold flex items-center gap-1">
          {!isAll && current?.leading}
          {isAll ? 'All' : current?.label.replace(/^All\s*/i, '')}
        </span>
      </button>
      {open && (
        <div className="absolute left-0 top-9 z-20 w-44 rounded-xl border border-border bg-card shadow-lg p-1">
          {options.map(o => (
            <button
              key={o.id}
              onClick={() => { onChange(o.id); setOpen(false) }}
              className={`w-full flex items-center gap-2 text-left text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                o.id === value ? 'bg-muted font-semibold' : 'hover:bg-muted/60'
              }`}
            >
              {o.leading}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
