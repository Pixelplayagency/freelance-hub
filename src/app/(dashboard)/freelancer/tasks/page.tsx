import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import Link from 'next/link'
import { formatDateTime, isOverdue, isDueSoon } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { TASK_STATUSES } from '@/lib/types/app.types'

const BAR_COLORS: Record<string, string> = {
  todo:        'bg-slate-300',
  in_progress: 'bg-blue-400',
  review:      'bg-amber-400',
  completed:   'bg-green-500',
}

export default async function FreelancerTasksPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: coAssigned } = await supabase
    .from('task_assignments')
    .select('task_id')
    .eq('user_id', user.id)
  const coIds = (coAssigned ?? []).map((r: { task_id: string }) => r.task_id)

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, project:projects(id, name, color)')
    .or(`assigned_to.eq.${user.id}${coIds.length > 0 ? `,id.in.(${coIds.join(',')})` : ''}`)
    .order('due_date', { ascending: true, nullsFirst: false })

  const allTasks = tasks ?? []

  // Build per-project progress
  const projectMap = new Map<string, { id: string; name: string; color: string; counts: Record<string, number>; total: number }>()
  for (const task of allTasks) {
    const project = task.project as { id: string; name: string; color: string } | null
    if (!project) continue
    if (!projectMap.has(project.id)) {
      projectMap.set(project.id, { id: project.id, name: project.name, color: project.color, counts: { todo: 0, in_progress: 0, review: 0, completed: 0 }, total: 0 })
    }
    const entry = projectMap.get(project.id)!
    entry.counts[task.status] = (entry.counts[task.status] ?? 0) + 1
    entry.total++
  }
  const projects = Array.from(projectMap.values())

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground mb-6">My Tasks</h1>

      {/* Project progress cards */}
      {projects.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Project Progress</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.map(p => {
              const completedPct = p.total > 0 ? Math.round((p.counts.completed / p.total) * 100) : 0
              return (
                <div key={p.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground shrink-0">{completedPct}% done</span>
                  </div>
                  {/* Segmented progress bar */}
                  <div className="flex h-2 rounded-full overflow-hidden gap-px bg-border">
                    {TASK_STATUSES.map(s => {
                      const pct = p.total > 0 ? (p.counts[s.id] / p.total) * 100 : 0
                      if (pct === 0) return null
                      return (
                        <div
                          key={s.id}
                          className={cn('h-full', BAR_COLORS[s.id])}
                          style={{ width: `${pct}%` }}
                          title={`${s.label}: ${p.counts[s.id]}`}
                        />
                      )
                    })}
                  </div>
                  <div className="flex gap-3 mt-2">
                    {TASK_STATUSES.filter(s => p.counts[s.id] > 0).map(s => (
                      <span key={s.id} className="text-[11px] text-muted-foreground">
                        {p.counts[s.id]} {s.label.toLowerCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tasks grouped by status */}
      {TASK_STATUSES.map(status => {
        const statusTasks = allTasks.filter(t => t.status === status.id)
        if (statusTasks.length === 0) return null
        return (
          <div key={status.id} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('w-2 h-2 rounded-full', {
                'bg-slate-400': status.id === 'todo',
                'bg-blue-500': status.id === 'in_progress',
                'bg-amber-500': status.id === 'review',
                'bg-green-500': status.id === 'completed',
              })} />
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{status.label}</h2>
              <span className="text-xs text-muted-foreground">({statusTasks.length})</span>
            </div>
            <div className="space-y-2">
              {statusTasks.map(task => {
                const project = task.project as { id: string; name: string; color: string } | null
                return (
                  <Link
                    key={task.id}
                    href={`/freelancer/tasks/${task.id}`}
                    className="flex items-center gap-3 p-3.5 bg-card rounded-xl border border-border hover:shadow-sm transition-shadow"
                  >
                    {project && (
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                      {project && <p className="text-xs text-muted-foreground mt-0.5">{project.name}</p>}
                    </div>
                    {task.due_date && (
                      <span className={cn(
                        'text-xs shrink-0',
                        isOverdue(task.due_date) && task.status !== 'completed' ? 'text-red-500 font-medium' :
                        isDueSoon(task.due_date) ? 'text-amber-500' : 'text-gray-400'
                      )}>
                        {formatDateTime(task.due_date)}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}

      {allTasks.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No tasks assigned to you yet.</p>
        </div>
      )}
    </div>
  )
}
