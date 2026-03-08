import { format, formatDistanceToNow, isPast, isToday, isTomorrow, parseISO } from 'date-fns'

export function formatDate(date: string | Date | null): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy')
}

export function formatDateShort(date: string | Date | null): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d')
}

/** Formats a datetime: shows time only if it's not midnight */
export function formatDateTime(date: string | Date | null): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0
  return hasTime ? format(d, 'MMM d, yyyy · h:mm a') : format(d, 'MMM d, yyyy')
}

export function formatDateTimeShort(date: string | Date | null): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0
  return hasTime ? format(d, 'MMM d · h:mm a') : format(d, 'MMM d')
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function isDueSoon(dueDate: string | null): boolean {
  if (!dueDate) return false
  const d = parseISO(dueDate)
  return isTomorrow(d) || isToday(d)
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  const d = parseISO(dueDate)
  return isPast(d) && !isToday(d)
}

export function dueDateLabel(dueDate: string | null): { label: string; className: string } {
  if (!dueDate) return { label: 'No due date', className: 'text-muted-foreground' }
  const d = parseISO(dueDate)
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0
  const timeStr = hasTime ? ` · ${format(d, 'h:mm a')}` : ''
  if (isToday(d)) return { label: `Due today${timeStr}`, className: 'text-amber-600 font-medium' }
  if (isTomorrow(d)) return { label: `Due tomorrow${timeStr}`, className: 'text-amber-500' }
  if (isPast(d)) return { label: `Overdue · ${formatDateTimeShort(d)}`, className: 'text-red-600 font-medium' }
  return { label: formatDateTime(d), className: 'text-muted-foreground' }
}
