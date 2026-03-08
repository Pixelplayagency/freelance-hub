'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarDays, Clock, X } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface DeadlinePickerProps {
  date: string   // YYYY-MM-DD
  time: string   // HH:MM or ''
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
}

export function DeadlinePicker({ date, time, onDateChange, onTimeChange }: DeadlinePickerProps) {
  const [open, setOpen] = useState(false)

  const selected = date ? parseISO(date) : undefined

  const displayLabel = selected
    ? time
      ? `${format(selected, 'MMM d, yyyy')} · ${formatTime(time)}`
      : format(selected, 'MMM d, yyyy')
    : null

  function handleDaySelect(day: Date | undefined) {
    if (!day) {
      onDateChange('')
      return
    }
    onDateChange(format(day, 'yyyy-MM-dd'))
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onDateChange('')
    onTimeChange('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 w-full rounded-lg border px-3 py-2.5 text-sm transition-colors text-left',
            'border-input bg-background hover:border-gray-300 focus:outline-none',
            displayLabel ? 'text-slate-800' : 'text-slate-400'
          )}
        >
          <CalendarDays className="w-4 h-4 shrink-0" style={{ color: '#f24a49' }} />
          <span className="flex-1">{displayLabel ?? 'Pick a deadline'}</span>
          {displayLabel && (
            <span
              role="button"
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleDaySelect}
          initialFocus
          classNames={{
            day: 'group/day relative aspect-square h-full w-full select-none p-0 text-center',
          }}
        />

        {/* Time picker row */}
        <div className="border-t border-gray-100 px-3 py-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
            <label className="text-xs text-gray-500 w-16 shrink-0">Time</label>
            <input
              type="time"
              value={time}
              onChange={e => onTimeChange(e.target.value)}
              className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f24a49]/30 focus:border-[#f24a49]"
            />
            {time && (
              <button
                type="button"
                onClick={() => onTimeChange('')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Done button */}
        {selected && (
          <div className="px-3 pb-3">
            <Button
              type="button"
              size="sm"
              className="w-full text-white text-xs"
              style={{ backgroundColor: '#f24a49' }}
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}
