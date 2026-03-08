'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils/cn'

interface DeadlinePickerProps {
  date: string  // YYYY-MM-DD
  time: string  // HH:MM or ''
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)   // 1–12
const MINUTES = ['00', '15', '30', '45']

export function DeadlinePicker({ date, time, onDateChange, onTimeChange }: DeadlinePickerProps) {
  const [open, setOpen] = useState(false)

  const selected = date ? parseISO(date) : undefined

  // Parse current time into parts
  const [hourStr, minStr] = time ? time.split(':') : ['', '']
  const h24 = hourStr ? parseInt(hourStr) : null
  const ampm = h24 !== null ? (h24 >= 12 ? 'PM' : 'AM') : 'AM'
  const hour12 = h24 !== null ? (h24 % 12 || 12) : null

  const displayLabel = selected
    ? time
      ? `${format(selected, 'EEE, MMM d yyyy')} · ${formatTime(time)}`
      : format(selected, 'EEE, MMM d yyyy')
    : null

  function handleDaySelect(day: Date | undefined) {
    if (!day) return
    onDateChange(format(day, 'yyyy-MM-dd'))
    // Auto-fill current time if no time set yet
    if (!time) {
      const now = new Date()
      const h = now.getHours()
      const m = now.getMinutes()
      // Round to nearest 15 min
      const roundedM = Math.round(m / 15) * 15 % 60
      const adjustedH = Math.round(m / 15) * 15 >= 60 ? h + 1 : h
      onTimeChange(`${String(adjustedH % 24).padStart(2, '0')}:${String(roundedM).padStart(2, '0')}`)
    }
  }

  function setHour(h12: number) {
    const isAM = ampm === 'AM'
    let h24val = isAM ? (h12 === 12 ? 0 : h12) : (h12 === 12 ? 12 : h12 + 12)
    onTimeChange(`${String(h24val).padStart(2, '0')}:${minStr || '00'}`)
  }

  function setMinute(m: string) {
    onTimeChange(`${hourStr || '12'}:${m}`)
  }

  function setAmPm(val: 'AM' | 'PM') {
    if (!hourStr) return
    let h = parseInt(hourStr)
    if (val === 'AM' && h >= 12) h -= 12
    if (val === 'PM' && h < 12) h += 12
    onTimeChange(`${String(h).padStart(2, '0')}:${minStr || '00'}`)
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
            'flex items-center gap-2.5 w-full rounded-lg border px-3 py-2.5 text-sm transition-all text-left',
            'border-input bg-white hover:border-[#f24a49]/50 focus:outline-none',
            open && 'border-[#f24a49]/60 ring-2 ring-[#f24a49]/10',
            displayLabel ? 'text-slate-800' : 'text-slate-400'
          )}
        >
          <CalendarDays className="w-4 h-4 shrink-0" style={{ color: '#f24a49' }} />
          <span className="flex-1 font-medium">{displayLabel ?? 'Pick a deadline'}</span>
          {displayLabel && (
            <span
              role="button"
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0 overflow-hidden rounded-xl border border-gray-100 shadow-xl"
        align="start"
        sideOffset={6}
      >
        {/* Calendar */}
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={handleDaySelect}
          showOutsideDays
          classNames={{
            root: 'p-4 pb-2',
            months: 'flex flex-col',
            month: 'space-y-3',
            nav: 'flex items-center justify-between mb-1',
            button_previous: cn(
              'w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200',
              'text-gray-500 hover:text-slate-900 hover:border-gray-300 hover:bg-gray-50 transition-colors'
            ),
            button_next: cn(
              'w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200',
              'text-gray-500 hover:text-slate-900 hover:border-gray-300 hover:bg-gray-50 transition-colors'
            ),
            month_caption: 'flex items-center justify-center',
            caption_label: 'text-sm font-semibold text-slate-800',
            weekdays: 'grid grid-cols-7 mb-1',
            weekday: 'text-[11px] font-medium text-gray-400 text-center py-1',
            weeks: 'space-y-1',
            week: 'grid grid-cols-7',
            day: 'flex items-center justify-center p-0',
            day_button: cn(
              'w-9 h-9 rounded-lg text-sm font-medium transition-all',
              'hover:bg-[#fff3f3] hover:text-[#f24a49]',
              'focus:outline-none focus:ring-2 focus:ring-[#f24a49]/30'
            ),
            selected: '[&>button]:bg-[#f24a49] [&>button]:text-white [&>button]:hover:bg-[#e03938] [&>button]:hover:text-white',
            today: '[&>button]:border [&>button]:border-[#f24a49]/40 [&>button]:text-[#f24a49]',
            outside: '[&>button]:text-gray-300 [&>button]:hover:text-gray-400 [&>button]:hover:bg-transparent',
            disabled: '[&>button]:opacity-30 [&>button]:cursor-not-allowed',
          }}
          components={{
            Chevron: ({ orientation }) =>
              orientation === 'left'
                ? <ChevronLeft className="w-4 h-4" />
                : <ChevronRight className="w-4 h-4" />,
          }}
        />

        {/* Time picker */}
        <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2.5">Time</p>
          <div className="flex items-center gap-2">
            {/* Hours */}
            <div className="flex flex-wrap gap-1 flex-1">
              {HOURS.map(h => (
                <button
                  key={h}
                  type="button"
                  disabled={!selected}
                  onClick={() => setHour(h)}
                  className={cn(
                    'w-8 h-7 rounded-md text-xs font-medium transition-all',
                    hour12 === h
                      ? 'text-white'
                      : 'text-gray-600 bg-white border border-gray-200 hover:border-[#f24a49]/40 hover:text-[#f24a49]',
                    !selected && 'opacity-40 cursor-not-allowed'
                  )}
                  style={hour12 === h ? { backgroundColor: '#f24a49' } : undefined}
                >
                  {h}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1 shrink-0">
              {/* Minutes */}
              <div className="flex gap-1">
                {MINUTES.map(m => (
                  <button
                    key={m}
                    type="button"
                    disabled={!selected}
                    onClick={() => setMinute(m)}
                    className={cn(
                      'w-9 h-7 rounded-md text-xs font-medium transition-all',
                      minStr === m
                        ? 'text-white'
                        : 'text-gray-600 bg-white border border-gray-200 hover:border-[#f24a49]/40 hover:text-[#f24a49]',
                      !selected && 'opacity-40 cursor-not-allowed'
                    )}
                    style={minStr === m ? { backgroundColor: '#f24a49' } : undefined}
                  >
                    :{m}
                  </button>
                ))}
              </div>
              {/* AM / PM */}
              <div className="flex gap-1">
                {(['AM', 'PM'] as const).map(val => (
                  <button
                    key={val}
                    type="button"
                    disabled={!selected || !time}
                    onClick={() => setAmPm(val)}
                    className={cn(
                      'flex-1 h-7 rounded-md text-xs font-semibold transition-all',
                      ampm === val && time
                        ? 'text-white'
                        : 'text-gray-500 bg-white border border-gray-200 hover:border-[#f24a49]/40 hover:text-[#f24a49]',
                      (!selected || !time) && 'opacity-40 cursor-not-allowed'
                    )}
                    style={ampm === val && time ? { backgroundColor: '#f24a49' } : undefined}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 bg-white">
          <span className="text-xs text-gray-400">
            {displayLabel ?? 'No deadline set'}
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#f24a49' }}
          >
            Confirm
          </button>
        </div>
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
