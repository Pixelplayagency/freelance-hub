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
  if (isToday(d)) return { label: 'Due today', className: 'text-amber-600 font-medium' }
  if (isTomorrow(d)) return { label: 'Due tomorrow', className: 'text-amber-500' }
  if (isPast(d)) return { label: `Overdue · ${formatDateShort(d)}`, className: 'text-red-600 font-medium' }
  return { label: formatDate(d), className: 'text-muted-foreground' }
}
