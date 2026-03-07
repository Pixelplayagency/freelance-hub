'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard } from './KanbanCard'
import { cn } from '@/lib/utils/cn'
import type { Task, TaskStatus } from '@/lib/types/app.types'

const STATUS_ACCENT: Record<string, string> = {
  todo: 'border-l-slate-300',
  in_progress: 'border-l-blue-400',
  review: 'border-l-amber-400',
  completed: 'border-l-emerald-400',
}

const STATUS_DOT: Record<string, string> = {
  todo: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  review: 'bg-amber-500',
  completed: 'bg-emerald-500',
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
}

export function KanbanColumn({ column, tasks, projectId, isAdmin }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const accent = STATUS_ACCENT[column.id] ?? 'border-l-slate-300'
  const dot = STATUS_DOT[column.id] ?? 'bg-slate-400'

  return (
    <div className="flex flex-col min-w-[272px] w-full">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={cn('w-2 h-2 rounded-full shrink-0', dot)} />
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          {column.label}
        </span>
        <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-xl p-2 min-h-[120px] transition-all border border-slate-200 border-l-4 bg-slate-50/80',
          accent,
          isOver && 'ring-2 ring-indigo-400 ring-offset-1 bg-indigo-50/30'
        )}
      >
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {tasks.map(task => (
              <KanbanCard
                key={task.id}
                task={task}
                projectId={projectId}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400 gap-1">
            <span>No tasks</span>
          </div>
        )}
      </div>
    </div>
  )
}
