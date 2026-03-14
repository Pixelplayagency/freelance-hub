'use client'

import { useState, useTransition } from 'react'
import { setTaskStatus } from '@/lib/actions/task.actions'
import { TASK_STATUSES } from '@/lib/types/app.types'
import { dueDateLabel } from '@/lib/utils/date'
import { CalendarClock, CheckCheck } from 'lucide-react'
import type { Task, Project, TaskStatus } from '@/lib/types/app.types'

type TaskWithProject = Task & {
  project: Pick<Project, 'id' | 'name' | 'color' | 'avatar_url'> | null
}

const STATUS_NEXT: Record<TaskStatus, TaskStatus> = {
  todo:        'in_progress',
  in_progress: 'review',
  review:      'completed',
  completed:   'todo',
}

const COLUMN_STYLES: Record<TaskStatus, { header: string; dot: string; badge: string; badgeText: string }> = {
  todo:        { header: 'text-slate-600', dot: 'bg-slate-400',    badge: 'bg-slate-100 hover:bg-slate-200',    badgeText: 'text-slate-700' },
  in_progress: { header: 'text-blue-600',  dot: 'bg-blue-400',     badge: 'bg-blue-100 hover:bg-blue-200',      badgeText: 'text-blue-700'  },
  review:      { header: 'text-amber-600', dot: 'bg-amber-400',    badge: 'bg-amber-100 hover:bg-amber-200',    badgeText: 'text-amber-700' },
  completed:   { header: 'text-green-600', dot: 'bg-green-500',    badge: 'bg-green-100 hover:bg-green-200',    badgeText: 'text-green-700' },
}

export function ContentPlannerTaskView({ tasks: initialTasks }: { tasks: TaskWithProject[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [, startTransition] = useTransition()

  function cycleStatus(task: TaskWithProject) {
    const next = STATUS_NEXT[task.status]
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t))
    startTransition(async () => {
      try {
        await setTaskStatus(task.id, next)
      } catch {
        // Revert on error
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t))
      }
    })
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CheckCheck className="w-10 h-10 text-muted-foreground/20 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No tasks assigned yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Tasks assigned to you will appear here</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {TASK_STATUSES.map(({ id: status, label }) => {
        const col = COLUMN_STYLES[status]
        const colTasks = tasks.filter(t => t.status === status)
        return (
          <div key={status} className="flex flex-col gap-2">
            {/* Column header */}
            <div className="flex items-center gap-2 px-1 mb-1">
              <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
              <span className={`text-xs font-semibold ${col.header}`}>{label}</span>
              <span className="ml-auto text-[11px] font-semibold text-muted-foreground/60 tabular-nums">
                {colTasks.length}
              </span>
            </div>

            {/* Task cards */}
            {colTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/50 px-3 py-5 text-center">
                <p className="text-[11px] text-muted-foreground/40">No tasks</p>
              </div>
            ) : (
              colTasks.map(task => {
                const { label: dateLabel, className: dateCls } = dueDateLabel(task.due_date)
                return (
                  <div
                    key={task.id}
                    className="rounded-xl border border-border bg-card p-3 space-y-2.5 hover:shadow-sm transition-shadow"
                  >
                    {/* Project */}
                    {task.project && (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: task.project.color }}
                        />
                        <span className="text-[10px] text-muted-foreground font-medium truncate">
                          {task.project.name}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <p className="text-xs font-semibold text-foreground leading-snug line-clamp-3">
                      {task.title}
                    </p>

                    {/* Description */}
                    {task.description && (
                      <p className="text-[11px] text-muted-foreground/70 leading-snug line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Footer: due date + status badge */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      {task.due_date ? (
                        <div className={`flex items-center gap-1 text-[10px] ${dateCls}`}>
                          <CalendarClock className="w-3 h-3 shrink-0" />
                          {dateLabel}
                        </div>
                      ) : (
                        <span />
                      )}

                      <button
                        onClick={() => cycleStatus(task)}
                        title="Click to advance status"
                        className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${col.badge} ${col.badgeText}`}
                      >
                        {label}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )
      })}
    </div>
  )
}
