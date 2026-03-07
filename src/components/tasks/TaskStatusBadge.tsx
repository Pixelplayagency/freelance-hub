import { cn } from '@/lib/utils/cn'
import { STATUS_BADGE_VARIANTS, TASK_STATUSES } from '@/lib/types/app.types'
import type { TaskStatus } from '@/lib/types/app.types'

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const label = TASK_STATUSES.find(s => s.id === status)?.label ?? status
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      STATUS_BADGE_VARIANTS[status]
    )}>
      {label}
    </span>
  )
}
