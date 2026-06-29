'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, CheckCircle2, GripVertical, MessageCircle, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatDateShort, isOverdue, isDueSoon } from '@/lib/utils/date'
import { deleteTask } from '@/lib/actions/task.actions'
import { useKanbanStore } from './useKanbanStore'
import type { Priority, Profile, Task } from '@/lib/types/app.types'
import { PRIORITY_CONFIG } from '@/lib/types/app.types'
import Link from 'next/link'
import { useTransition } from 'react'
import { toast } from 'sonner'

type AssigneeInfo = Pick<Profile, 'id' | 'full_name' | 'avatar_url'>

interface KanbanCardProps {
  task: Task
  projectId: string
  isAdmin: boolean
  isDragging?: boolean
  assignees?: AssigneeInfo[]
  commentCount?: number
  subtaskProgress?: { done: number; total: number }
}

export function KanbanCard({ task, projectId, isAdmin, isDragging, assignees = [], commentCount = 0, subtaskProgress }: KanbanCardProps) {
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

  const taskHref = isAdmin
    ? `/admin/projects/${projectId}/tasks/${task.id}`
    : `/freelancer/tasks/${task.id}`

  const [isDeleting, startDelete] = useTransition()
  const removeTask = useKanbanStore(s => s.removeTask)
  const addTask = useKanbanStore(s => s.addTask)

  const priority = (task.priority ?? 'medium') as Priority
  const priorityCfg = PRIORITY_CONFIG[priority]

  const allAssignees = assignees.length > 0
    ? assignees
    : task.assignee
      ? [{ id: task.assignee.id, full_name: task.assignee.full_name, avatar_url: task.assignee.avatar_url }]
      : []

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    removeTask(task.id)
    let undone = false
    let committed = false
    const commit = () => {
      if (undone || committed) return
      committed = true
      startDelete(() => deleteTask(task.id, projectId))
    }
    toast('Task deleted', {
      duration: 5000,
      action: { label: 'Undo', onClick: () => { undone = true; addTask(task) } },
      onAutoClose: commit,
      onDismiss: commit,
    })
  }

  const overdue = task.due_date && isOverdue(task.due_date) && task.status !== 'completed'
  const dueSoon = task.due_date && isDueSoon(task.due_date) && task.status !== 'completed'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('touch-none', isSortableDragging && 'opacity-40')}
      {...attributes}
    >
      <div
        className={cn(
          'group bg-card rounded-xl border border-border p-3.5 cursor-grab active:cursor-grabbing transition-all',
          'hover:shadow-md hover:border-border/80 hover:-translate-y-px',
          isDragging && 'shadow-2xl rotate-1 scale-[1.02] opacity-90 cursor-grabbing',
          isDeleting && 'opacity-40 pointer-events-none'
        )}
        {...listeners}
      >
        {/* Top row: priority badge + drag handle + delete */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', priorityCfg.bg, priorityCfg.color)}>
            {priorityCfg.label}
          </span>
          <div className="flex-1" />
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          {isAdmin && (
            <button
              onClick={handleDelete}
              title="Delete task"
              className="inline-flex items-center justify-center h-6 w-6 shrink-0 rounded-md text-muted-foreground/50 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Title */}
        <Link
          href={taskHref}
          className="block text-sm font-semibold text-foreground hover:text-primary leading-snug line-clamp-2 transition-colors mb-1"
          onClick={e => e.stopPropagation()}
        >
          {task.title}
        </Link>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
        )}

        {/* Bottom section */}
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border/50">
          {/* Assignee avatars */}
          {allAssignees.length > 0 ? (
            <div className="flex -space-x-1.5">
              {allAssignees.slice(0, 3).map((a, i) => {
                const ini = a.full_name
                  ? a.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                  : '?'
                return (
                  <div
                    key={a.id ?? i}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-2 ring-card shrink-0 overflow-hidden"
                    style={{ backgroundColor: 'var(--primary)' }}
                    title={a.full_name ?? undefined}
                  >
                    {a.avatar_url
                      ? <img src={a.avatar_url} className="w-full h-full object-cover" alt="" />
                      : ini}
                  </div>
                )
              })}
              {allAssignees.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[9px] font-medium text-muted-foreground ring-2 ring-card">
                  +{allAssignees.length - 3}
                </div>
              )}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border-2 border-dashed border-border shrink-0" />
          )}

          <div className="flex-1" />

          {/* Subtask progress */}
          {subtaskProgress && subtaskProgress.total > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <CheckCircle2 className="w-3 h-3" />
              <span className="font-medium tabular-nums">{subtaskProgress.done}/{subtaskProgress.total}</span>
            </div>
          )}

          {/* Comment count */}
          {commentCount > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MessageCircle className="w-3 h-3" />
              <span className="font-medium tabular-nums">{commentCount}</span>
            </div>
          )}

          {/* Due date */}
          {task.due_date && (
            <div className={cn(
              'flex items-center gap-1 text-[11px] font-medium',
              overdue ? 'text-red-500' : dueSoon ? 'text-amber-500' : 'text-muted-foreground'
            )}>
              <Calendar className="w-3 h-3" />
              {formatDateShort(task.due_date)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
