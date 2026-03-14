import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Instagram, Facebook, ArrowRight, CheckCircle2, AlertCircle, Clock, ListTodo } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatDateTimeShort, isOverdue, isDueSoon } from '@/lib/utils/date'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import type { Project, Task, TaskStatus } from '@/lib/types/app.types'

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" />
    </svg>
  )
}

const BAR_COLORS: Record<TaskStatus, string> = {
  todo:        'bg-muted-foreground/60',
  in_progress: 'bg-blue-400',
  review:      'bg-amber-400',
  completed:   'bg-green-500',
}

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'review', 'completed']

type TaskWithProject = Task & { project: Pick<Project, 'id' | 'name' | 'color'> | null }

interface ProjectEntry {
  project: Project
  tasks: TaskWithProject[]
  counts: Record<TaskStatus, number>
  total: number
  completed: number
}

export default async function FreelancerProjectsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Co-assigned task IDs
  const { data: coAssigned } = await supabase
    .from('task_assignments')
    .select('task_id')
    .eq('user_id', user.id)
  const coIds = (coAssigned ?? []).map((r: { task_id: string }) => r.task_id)

  // All my tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, project:projects(id, name, color, cover_image_url, avatar_url, description, instagram_url, facebook_url, tiktok_url, status)')
    .or(`assigned_to.eq.${user.id}${coIds.length > 0 ? `,id.in.(${coIds.join(',')})` : ''}`)
    .order('due_date', { ascending: true, nullsFirst: false })

  const allTasks = (tasks ?? []) as TaskWithProject[]

  // Group tasks by project (only active projects)
  const projectMap = new Map<string, ProjectEntry>()
  for (const task of allTasks) {
    const p = task.project as (Pick<Project, 'id' | 'name' | 'color'> & Partial<Project>) | null
    if (!p || (p as Project).status === 'archived') continue
    if (!projectMap.has(p.id)) {
      projectMap.set(p.id, {
        project: p as Project,
        tasks: [],
        counts: { todo: 0, in_progress: 0, review: 0, completed: 0 },
        total: 0,
        completed: 0,
      })
    }
    const entry = projectMap.get(p.id)!
    entry.tasks.push(task)
    entry.counts[task.status as TaskStatus] = (entry.counts[task.status as TaskStatus] ?? 0) + 1
    entry.total++
    if (task.status === 'completed') entry.completed++
  }

  const projectEntries = Array.from(projectMap.values())

  // Global stats
  const totalTasks = allTasks.length
  const overdueCount = allTasks.filter(t => isOverdue(t.due_date) && t.status !== 'completed').length
  const inProgressCount = allTasks.filter(t => t.status === 'in_progress').length
  const completedCount = allTasks.filter(t => t.status === 'completed').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        <p className={cn('text-sm mt-0.5', overdueCount > 0 ? 'text-[#f24a49] font-medium' : 'text-muted-foreground')}>
          {overdueCount > 0
            ? `${overdueCount} overdue task${overdueCount !== 1 ? 's' : ''} need attention`
            : `${totalTasks} task${totalTasks !== 1 ? 's' : ''} across ${projectEntries.length} project${projectEntries.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Stats strip */}
      {totalTasks > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: totalTasks, icon: ListTodo, color: 'text-foreground', bg: 'bg-muted' },
            { label: 'In Progress', value: inProgressCount, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Overdue', value: overdueCount, icon: AlertCircle, color: 'text-[#f24a49]', bg: 'bg-red-50 dark:bg-red-900/20' },
            { label: 'Completed', value: completedCount, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', s.bg)}>
                  <Icon className={cn('w-4 h-4', s.color)} />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground tabular-nums leading-none">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Project panels */}
      {projectEntries.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <ListTodo className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-foreground">No tasks yet</p>
          <p className="text-xs text-muted-foreground mt-1">Tasks will appear here once assigned to you</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projectEntries.map(({ project, tasks: projectTasks, counts, total, completed }) => {
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0
            const pendingTasks = projectTasks.filter(t => t.status !== 'completed')
            const hasSocials = project.instagram_url || project.facebook_url || project.tiktok_url
            const initial = project.name.charAt(0).toUpperCase()

            return (
              <div key={project.id} className="bg-card border border-border rounded-2xl overflow-hidden">

                {/* Cover banner */}
                <div className="relative h-20 overflow-hidden">
                  {project.cover_image_url ? (
                    <img src={project.cover_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{ background: `linear-gradient(135deg, ${project.color}cc, ${project.color})` }}
                    />
                  )}
                  {/* Progress badge top-right */}
                  <div className="absolute top-2 right-3 bg-black/40 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    {pct}% done
                  </div>
                </div>

                <div className="px-5 pb-5 -mt-6 relative">
                  {/* Avatar + name row */}
                  <div className="flex items-end gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full border-2 border-card overflow-hidden shrink-0 shadow-sm">
                      {project.avatar_url ? (
                        <img src={project.avatar_url} alt={project.name} className="w-full h-full object-cover" />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-lg font-bold text-white"
                          style={{ backgroundColor: project.color }}
                        >
                          {initial}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-0.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-foreground leading-snug truncate">{project.name}</h2>
                        {hasSocials && (
                          <div className="flex items-center gap-2 shrink-0">
                            {project.instagram_url && (
                              <a href={project.instagram_url} target="_blank" rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-[#E1306C] transition-colors">
                                <Instagram className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {project.facebook_url && (
                              <a href={project.facebook_url} target="_blank" rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-[#1877F2] transition-colors">
                                <Facebook className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {project.tiktok_url && (
                              <a href={project.tiktok_url} target="_blank" rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors">
                                <TikTokIcon className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{project.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Segmented progress bar */}
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-border mb-1 gap-px">
                    {STATUS_ORDER.map(s => {
                      const barPct = total > 0 ? (counts[s] / total) * 100 : 0
                      if (barPct === 0) return null
                      return (
                        <div
                          key={s}
                          className={cn('h-full', BAR_COLORS[s])}
                          style={{ width: `${barPct}%` }}
                        />
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    {STATUS_ORDER.filter(s => counts[s] > 0).map(s => (
                      <span key={s} className="text-[10px] text-muted-foreground capitalize">
                        {counts[s]} {s.replace('_', ' ')}
                      </span>
                    ))}
                  </div>

                  {/* Task rows */}
                  {pendingTasks.length === 0 ? (
                    <div className="flex items-center gap-2 py-3 px-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-sm text-green-700 dark:text-green-400 font-medium">All tasks complete!</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {pendingTasks.slice(0, 5).map(task => {
                        const overdue = isOverdue(task.due_date) && task.status !== 'completed'
                        const dueSoon = isDueSoon(task.due_date)
                        return (
                          <Link
                            key={task.id}
                            href={`/freelancer/tasks/${task.id}`}
                            className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-muted transition-colors group"
                          >
                            {/* Status dot */}
                            <div className={cn('w-2 h-2 rounded-full shrink-0', {
                              'bg-muted-foreground': task.status === 'todo',
                              'bg-blue-400': task.status === 'in_progress',
                              'bg-amber-400': task.status === 'review',
                              'bg-green-500': task.status === 'completed',
                            })} />
                            <span className="flex-1 min-w-0 text-sm text-foreground group-hover:text-[#f24a49] transition-colors truncate font-medium">
                              {task.title}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <TaskStatusBadge status={task.status as TaskStatus} />
                              {task.due_date && (
                                <span className={cn('text-[11px] hidden sm:block', {
                                  'text-[#f24a49] font-semibold': overdue,
                                  'text-amber-500 font-medium': !overdue && dueSoon,
                                  'text-muted-foreground': !overdue && !dueSoon,
                                })}>
                                  {formatDateTimeShort(task.due_date)}
                                </span>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                      {pendingTasks.length > 5 && (
                        <p className="text-xs text-muted-foreground pl-3 pt-0.5">
                          +{pendingTasks.length - 5} more task{pendingTasks.length - 5 !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      {total} task{total !== 1 ? 's' : ''} · {completed} completed
                    </span>
                    <Link
                      href={`/freelancer/projects/${project.id}`}
                      className="flex items-center gap-1 text-xs font-semibold hover:gap-2 transition-all"
                      style={{ color: '#f24a49' }}
                    >
                      View full board <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
