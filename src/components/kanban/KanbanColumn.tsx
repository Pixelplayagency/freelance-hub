'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard } from './KanbanCard'
import { cn } from '@/lib/utils/cn'
import { Plus } from 'lucide-react'
import type { Task, TaskStatus, Profile } from '@/lib/types/app.types'

type AssigneeMap = Record<string, Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[]>
type CountMap = Record<string, number>
type SubtaskMap = Record<string, { done: number; total: number }>

const STATUS_DOT: Record<string, string> = {
  todo: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  review: 'bg-amber-500',
  completed: 'bg-emerald-500',
}

const STATUS_ACCENT: Record<string, string> = {
  todo: 'border-t-slate-300',
  in_progress: 'border-t-blue-400',
  review: 'border-t-amber-400',
  completed: 'border-t-emerald-400',
}

interface ColumnDef {
  id: TaskStatus
  label: string
  bg: string
  dot: string
}

interface KanbanColumnProps {
  column: ColumnDef
  tasks: Task[]
  projectId: string
  isAdmin: boolean
  assigneeMap?: AssigneeMap
  commentCounts?: CountMap
  subtaskCounts?: SubtaskMap
  onAddTask?: (status: TaskStatus) => void
}

export function KanbanColumn({ column, tasks, projectId, isAdmin, assigneeMap = {}, commentCounts = {}, subtaskCounts = {}, onAddTask }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const dot = STATUS_DOT[column.id] ?? 'bg-muted-foreground'
  const accent = STATUS_ACCENT[column.id] ?? 'border-t-slate-300'

  return (
    <div className="flex flex-col min-w-[280px] w-full">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', dot)} />
        <span className="text-sm font-semibold text-foreground">
          {column.label}
        </span>
        <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full min-w-[22px] text-center tabular-nums">
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-xl p-2 min-h-[120px] transition-all border-t-[3px] bg-muted/30',
          accent,
          isOver && 'ring-2 ring-primary/30 ring-offset-2 bg-primary/5'
        )}
      >
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2.5">
            {tasks.map(task => (
              <KanbanCard
                key={task.id}
                task={task}
                projectId={projectId}
                isAdmin={isAdmin}
                assignees={assigneeMap[task.id]}
                commentCount={commentCounts[task.id] ?? 0}
                subtaskProgress={subtaskCounts[task.id]}
              />
            ))}
          </div>
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-border/50 rounded-xl text-xs text-muted-foreground/50">
            <span>No tasks</span>
          </div>
        )}

        {/* Add task button */}
        {isAdmin && onAddTask && (
          <button
            type="button"
            onClick={() => onAddTask(column.id)}
            className="w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-border/50 text-sm text-muted-foreground/60 hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Task
          </button>
        )}
      </div>
    </div>
  )
}
