'use client'

import Link from 'next/link'
import { ChevronRight, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Task, TaskStatus, Profile } from '@/lib/types/app.types'
import { TASK_STATUSES } from '@/lib/types/app.types'

type AssigneeMap = Record<string, Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[]>

interface Props {
  tasks: Task[]
  projectId: string
  isAdmin: boolean
  assigneeMap?: AssigneeMap
}

const STATUS_STYLES: Record<TaskStatus, { dot: string; border: string; header: string }> = {
  todo:        { dot: 'bg-muted-foreground',  border: 'border-l-muted-foreground',  header: 'text-muted-foreground' },
  in_progress: { dot: 'bg-blue-500',          border: 'border-l-blue-400',          header: 'text-blue-400'         },
  review:      { dot: 'bg-amber-500',         border: 'border-l-amber-400',         header: 'text-amber-400'        },
  completed:   { dot: 'bg-green-500',         border: 'border-l-green-400',         header: 'text-green-400'        },
}

const BAR_COLORS: Record<TaskStatus, string> = {
  todo:        'bg-muted-foreground',
  in_progress: 'bg-blue-400',
  review:      'bg-amber-400',
  completed:   'bg-green-500',
}

function isOverdue(due: string) {
  return new Date(due) < new Date()
}
function isDueSoon(due: string) {
  const d = new Date(due)
  const now = new Date()
  return d >= now && (d.getTime() - now.getTime()) < 2 * 24 * 60 * 60 * 1000
}
function formatDue(due: string) {
  return new Date(due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ProjectTaskList({ tasks, projectId, isAdmin, assigneeMap = {} }: Props) {
  const total = tasks.length

  const counts = TASK_STATUSES.reduce<Record<TaskStatus, number>>((acc, s) => {
    acc[s.id] = tasks.filter(t => t.status === s.id).length
    return acc
  }, { todo: 0, in_progress: 0, review: 0, completed: 0 })

  return (
    <div className="space-y-6">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {TASK_STATUSES.map(s => (
          <div
            key={s.id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium"
          >
            <span className={cn('w-2 h-2 rounded-full', STATUS_STYLES[s.id].dot)} />
            <span className="text-foreground">{s.label}</span>
            <span className="text-muted-foreground">{counts[s.id]}</span>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="flex h-2 rounded-full overflow-hidden gap-px bg-border">
          {TASK_STATUSES.map(s => {
            const pct = (counts[s.id] / total) * 100
            if (pct === 0) return null
            return (
              <div
                key={s.id}
                className={cn('h-full transition-all', BAR_COLORS[s.id])}
                style={{ width: `${pct}%` }}
                title={`${s.label}: ${counts[s.id]}`}
              />
            )
          })}
        </div>
      )}

      {/* Task groups */}
      <div className="space-y-5">
        {TASK_STATUSES.map(s => {
          const group = tasks.filter(t => t.status === s.id)
          const styles = STATUS_STYLES[s.id]
          return (
            <div key={s.id}>
              {/* Group header */}
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('w-2 h-2 rounded-full', styles.dot)} />
                <span className={cn('text-xs font-semibold uppercase tracking-wider', styles.header)}>
                  {s.label}
                </span>
                <span className="text-xs text-muted-foreground">({counts[s.id]})</span>
              </div>

              {group.length === 0 ? (
                <div className="text-xs text-muted-foreground pl-4 py-2 italic">No tasks</div>
              ) : (
                <div className="space-y-1.5">
                  {group.map(task => {
                    // Co-assignees from junction table (deduplicated by id)
                    const coAssignees = assigneeMap[task.id] ?? []
                    const primaryAssignee = task.assignee as { id?: string; full_name: string | null; avatar_url: string | null } | null
                    const allAssignees = coAssignees.length > 0
                      ? coAssignees
                      : primaryAssignee
                        ? [{ id: primaryAssignee.id ?? '', full_name: primaryAssignee.full_name, avatar_url: primaryAssignee.avatar_url }]
                        : []
                    const href = isAdmin
                      ? `/admin/projects/${projectId}/tasks/${task.id}`
                      : `/freelancer/tasks/${task.id}`

                    return (
                      <Link
                        key={task.id}
                        href={href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 bg-card rounded-lg border border-border border-l-4',
                          'hover:shadow-sm transition-shadow group',
                          styles.border
                        )}
                      >
                        {/* Title */}
                        <p className="flex-1 text-sm font-medium text-foreground truncate">
                          {task.title}
                        </p>

                        {/* Assignees (stacked avatars) */}
                        {allAssignees.length > 0 && (
                          <div className="hidden sm:flex items-center shrink-0">
                            <div className="flex -space-x-1.5">
                              {allAssignees.slice(0, 3).map((a, i) => {
                                const ini = a.full_name
                                  ? a.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                                  : '?'
                                return (
                                  <div
                                    key={a.id ?? i}
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white ring-2 ring-card shrink-0"
                                    style={{ backgroundColor: '#f24a49' }}
                                    title={a.full_name ?? undefined}
                                  >
                                    {a.avatar_url
                                      ? <img src={a.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                                      : ini}
                                  </div>
                                )
                              })}
                              {allAssignees.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-medium text-muted-foreground ring-2 ring-card">
                                  +{allAssignees.length - 3}
                                </div>
                              )}
                            </div>
                            {allAssignees.length === 1 && (
                              <span className="text-xs text-muted-foreground ml-1.5 hidden md:block truncate max-w-[100px]">
                                {allAssignees[0].full_name}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Due date */}
                        {task.due_date && (
                          <div className={cn(
                            'hidden sm:flex items-center gap-1 text-xs shrink-0',
                            isOverdue(task.due_date) && task.status !== 'completed' ? 'text-red-500 font-medium' :
                            isDueSoon(task.due_date) ? 'text-amber-500' : 'text-muted-foreground'
                          )}>
                            <Calendar className="w-3 h-3" />
                            {formatDue(task.due_date)}
                          </div>
                        )}

                        {/* Chevron */}
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {total === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No tasks yet. Add the first task to get started.</p>
        </div>
      )}
    </div>
  )
}
