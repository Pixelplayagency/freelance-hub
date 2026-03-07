import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import { AlertTriangle, CheckCircle2, Clock, ListTodo } from 'lucide-react'
import Link from 'next/link'
import { formatDate, isOverdue, isDueSoon } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'

export default async function FreelancerDashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, project:projects(id, name, color)')
    .eq('assigned_to', user.id)
    .order('due_date', { ascending: true, nullsFirst: false })

  const allTasks = tasks ?? []
  const todo = allTasks.filter(t => t.status === 'todo').length
  const inProgress = allTasks.filter(t => t.status === 'in_progress').length
  const inReview = allTasks.filter(t => t.status === 'review').length
  const completed = allTasks.filter(t => t.status === 'completed').length
  const overdue = allTasks.filter(t => isOverdue(t.due_date) && t.status !== 'completed').length
  const dueSoon = allTasks.filter(t => isDueSoon(t.due_date) && t.status !== 'completed').length

  const activeTasks = allTasks.filter(t => t.status !== 'completed')

  const stats = [
    { label: 'To Do', value: todo, icon: ListTodo, gradient: 'from-slate-400 to-slate-500' },
    { label: 'In Progress', value: inProgress, icon: Clock, gradient: 'from-blue-500 to-cyan-500' },
    { label: 'In Review', value: inReview, icon: AlertTriangle, gradient: 'from-amber-500 to-orange-500' },
    { label: 'Completed', value: completed, icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">{allTasks.length} task{allTasks.length !== 1 ? 's' : ''} assigned to you</p>
      </div>

      {/* Alerts */}
      {(overdue > 0 || dueSoon > 0) && (
        <div className="flex flex-wrap gap-3">
          {overdue > 0 && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-2.5 text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              {overdue} overdue task{overdue !== 1 ? 's' : ''}
            </div>
          )}
          {dueSoon > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-4 py-2.5 text-sm font-medium">
              <Clock className="w-4 h-4" />
              {dueSoon} due soon
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-5 flex flex-col gap-3">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">{s.value}</div>
                <div className="text-sm text-slate-500 mt-0.5">{s.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Active tasks */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Active Tasks</h2>
        {activeTasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-sm font-medium text-slate-500">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1">No active tasks assigned to you</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeTasks.map(task => {
              const project = task.project as { id: string; name: string; color: string } | null
              return (
                <Link
                  key={task.id}
                  href={`/freelancer/tasks/${task.id}`}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200/70 shadow-sm hover:shadow-md transition-shadow group"
                >
                  {project && (
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{task.title}</p>
                    {project && <p className="text-xs text-slate-400 mt-0.5">{project.name}</p>}
                  </div>
                  <TaskStatusBadge status={task.status} />
                  {task.due_date && (
                    <span className={cn(
                      'text-xs shrink-0 font-medium',
                      isOverdue(task.due_date) ? 'text-red-500' :
                      isDueSoon(task.due_date) ? 'text-amber-500' : 'text-slate-400'
                    )}>
                      {formatDate(task.due_date)}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
