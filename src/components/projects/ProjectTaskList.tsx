'use client'

import Link from 'next/link'
import { ChevronRight, CalendarClock, ListTodo } from 'lucide-react'
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

const STATUS_STYLES: Record<TaskStatus, {
  dot: string
  leftBar: string
  header: string
  headerBg: string
  countBadge: string
}> = {
  todo:        { dot: 'bg-slate-400',  leftBar: 'border-l-slate-300',   header: 'text-slate-500 dark:text-slate-400',  headerBg: 'bg-slate-50 dark:bg-slate-800/50',   countBadge: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
  in_progress: { dot: 'bg-blue-500',   leftBar: 'border-l-blue-400',    header: 'text-blue-600 dark:text-blue-400',    headerBg: 'bg-blue-50 dark:bg-blue-900/30',     countBadge: 'bg-blue-100 text-blue-700 dark:bg-blue-800/60 dark:text-blue-300'  },
  review:      { dot: 'bg-amber-500',  leftBar: 'border-l-amber-400',   header: 'text-amber-600 dark:text-amber-400',  headerBg: 'bg-amber-50 dark:bg-amber-900/30',   countBadge: 'bg-amber-100 text-amber-700 dark:bg-amber-800/60 dark:text-amber-300' },
  completed:   { dot: 'bg-green-500',  leftBar: 'border-l-green-400',   header: 'text-green-600 dark:text-green-400',  headerBg: 'bg-green-50 dark:bg-green-900/30',   countBadge: 'bg-green-100 text-green-700 dark:bg-green-800/60 dark:text-green-300' },
}

function isOverdue(due: string) { return new Date(due) < new Date() }
function isDueSoon(due: string) {
  const d = new Date(due)
  const now = new Date()
  return d >= now && (d.getTime() - now.getTime()) < 2 * 24 * 60 * 60 * 1000
}
function formatDue(due: string) {
  return new Date(due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ProjectTaskList({ tasks, projectId, isAdmin, assigneeMap = {} }: Props) {
  const counts = TASK_STATUSES.reduce<Record<TaskStatus, number>>((acc, s) => {
    acc[s.id] = tasks.filter(t => t.status === s.id).length
    return acc
  }, { todo: 0, in_progress: 0, review: 0, completed: 0 })

  // Only show groups that have tasks, but always show todo/in_progress/review even if empty
  const visibleStatuses = TASK_STATUSES.filter(s =>
    s.id !== 'completed' ? true : counts[s.id] > 0
  )

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ListTodo className="w-10 h-10 text-muted-foreground/20 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No tasks yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Tasks assigned to this project will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {visibleStatuses.map(s => {
        const group = tasks.filter(t => t.status === s.id)
        const styles = STATUS_STYLES[s.id]

        return (
          <div key={s.id} className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Group header */}
            <div className={cn('flex items-center gap-2.5 px-4 py-3 border-b border-border', styles.headerBg)}>
              <span className={cn('w-2 h-2 rounded-full shrink-0', styles.dot)} />
              <span className={cn('text-xs font-bold uppercase tracking-widest', styles.header)}>
                {s.label}
              </span>
              <span className={cn('ml-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-full', styles.countBadge)}>
                {counts[s.id]}
              </span>
            </div>

            {/* Tasks */}
            {group.length === 0 ? (
              <div className="px-4 py-5 text-center">
                <p className="text-xs text-muted-foreground/50 italic">No tasks</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {group.map(task => {
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
                        'flex items-center gap-3 px-4 py-3.5 border-l-4 hover:bg-muted/40 transition-colors group',
                        styles.leftBar
                      )}
                    >
                      {/* Title + description */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate leading-snug">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5 leading-snug">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Assignees */}
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
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-card shrink-0 overflow-hidden"
                                  style={{ backgroundColor: '#f24a49' }}
                                  title={a.full_name ?? undefined}
                                >
                                  {a.avatar_url
                                    ? <img src={a.avatar_url} className="w-full h-full object-cover" alt="" />
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
                            <span className="text-xs text-muted-foreground ml-2 hidden md:block truncate max-w-[100px]">
                              {allAssignees[0].full_name}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Due date */}
                      {task.due_date && (
                        <div className={cn(
                          'hidden sm:flex items-center gap-1 text-xs shrink-0 font-medium',
                          isOverdue(task.due_date) && task.status !== 'completed'
                            ? 'text-red-500'
                            : isDueSoon(task.due_date)
                            ? 'text-amber-500'
                            : 'text-muted-foreground'
                        )}>
                          <CalendarClock className="w-3 h-3" />
                          {formatDue(task.due_date)}
                        </div>
                      )}

                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 group-hover:text-foreground transition-colors" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
