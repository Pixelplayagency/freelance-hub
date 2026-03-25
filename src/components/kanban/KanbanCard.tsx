'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { dueDateLabel, formatDateTimeShort } from '@/lib/utils/date'
import { deleteTask } from '@/lib/actions/task.actions'
import { useKanbanStore } from './useKanbanStore'
import type { Task } from '@/lib/types/app.types'
import Link from 'next/link'
import { useTransition } from 'react'

interface KanbanCardProps {
  task: Task
  projectId: string
  isAdmin: boolean
  isDragging?: boolean
}

export function KanbanCard({ task, projectId, isAdmin, isDragging }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dateInfo = dueDateLabel(task.due_date)
  const taskHref = isAdmin
    ? `/admin/projects/${projectId}/tasks/${task.id}`
    : `/freelancer/tasks/${task.id}`

  const [isDeleting, startDelete] = useTransition()
  const removeTask = useKanbanStore(s => s.removeTask)

  const initials = task.assignee?.full_name
    ? task.assignee.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : task.assignee?.email?.[0]?.toUpperCase() ?? '?'

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Delete this task?')) return
    removeTask(task.id) // optimistic — remove from UI immediately
    startDelete(() => deleteTask(task.id, projectId))
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'touch-none',
        isSortableDragging && 'opacity-40'
      )}
      {...attributes}
    >
      <div
        className={cn(
          'group bg-card rounded-lg border border-border p-3 cursor-grab active:cursor-grabbing hover:shadow-sm hover:border-[#d4d4d4] transition-all',
          isDragging && 'shadow-2xl rotate-1 scale-[1.02] opacity-90 cursor-grabbing',
          isDeleting && 'opacity-40 pointer-events-none'
        )}
        {...listeners}
      >
        {/* Title row with delete button */}
        <div className="flex items-start gap-1 mb-1.5">
          <Link
            href={taskHref}
            className="flex-1 text-sm font-semibold text-foreground hover:text-primary leading-snug line-clamp-2 transition-colors"
            onClick={e => e.stopPropagation()}
          >
            {task.title}
          </Link>
          {isAdmin && (
            <button
              onClick={handleDelete}
              title="Delete task"
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all shrink-0 -mt-0.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{task.description}</p>
        )}

        <div className="flex items-center justify-between mt-2">
          {/* Assignee avatar */}
          {task.assignee ? (
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0" style={{ backgroundColor: 'var(--primary)' }}>
              {initials}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border-2 border-dashed border-border shrink-0" />
          )}

          {/* Due date */}
          {task.due_date && (
            <div className={cn('flex items-center gap-1 text-[11px] font-medium', dateInfo.className)}>
              <Calendar className="w-3 h-3" />
              {formatDateTimeShort(task.due_date)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
