import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FolderKanban, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate, isOverdue } from '@/lib/utils/date'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import type { TaskStatus } from '@/lib/types/app.types'

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  const [
    { data: projects },
    { data: allTasks },
    { data: tasksDueToday },
    { data: recentTasks },
  ] = await Promise.all([
    supabase.from('projects').select('id').eq('status', 'active'),
    supabase.from('tasks').select('status, due_date'),
    supabase
      .from('tasks')
      .select('id, title, status, due_date, assignee:profiles!assigned_to(full_name, email)')
      .eq('due_date', today)
      .neq('status', 'completed'),
    supabase
      .from('tasks')
      .select('id, title, status, due_date, project:projects(id, name, color), assignee:profiles!assigned_to(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const tasks = allTasks ?? []
  const inReview = tasks.filter(t => t.status === 'review').length
  const completedCount = tasks.filter(t => t.status === 'completed').length
  const overdueCount = tasks.filter(t => isOverdue(t.due_date) && t.status !== 'completed').length
  const totalActive = tasks.filter(t => t.status !== 'completed').length

  const stats = [
    {
      label: 'Active Projects',
      value: projects?.length ?? 0,
      icon: FolderKanban,
      gradient: 'from-indigo-500 to-violet-500',
      href: '/admin/projects',
    },
    {
      label: 'Active Tasks',
      value: totalActive,
      icon: Clock,
      gradient: 'from-blue-500 to-cyan-500',
      href: '/admin/projects',
    },
    {
      label: 'In Review',
      value: inReview,
      icon: AlertCircle,
      gradient: 'from-amber-500 to-orange-500',
      href: '/admin/projects',
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: CheckCircle2,
      gradient: 'from-emerald-500 to-teal-500',
      href: '/admin/projects',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {overdueCount > 0
            ? `${overdueCount} overdue task${overdueCount !== 1 ? 's' : ''} need attention`
            : 'Everything looks good — all tasks on track'}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <Link
              key={s.label}
              href={s.href}
              className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col gap-3"
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">{s.value}</div>
                <div className="text-sm text-slate-500 mt-0.5">{s.label}</div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Due today */}
        <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-slate-700">Due Today</h2>
            {(tasksDueToday?.length ?? 0) > 0 && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                {tasksDueToday?.length}
              </span>
            )}
          </div>
          {(tasksDueToday?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">No tasks due today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasksDueToday?.map(task => {
                const assignee = (task.assignee as unknown) as { full_name: string | null; email: string } | null
                return (
                  <div key={task.id} className="flex items-center gap-2 py-1">
                    <TaskStatusBadge status={task.status as TaskStatus} />
                    <span className="text-sm text-slate-700 flex-1 truncate">{task.title}</span>
                    {assignee && (
                      <span className="text-xs text-slate-400 shrink-0">
                        {assignee.full_name ?? assignee.email}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent tasks */}
        <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Recent Tasks</h2>
          {(recentTasks?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">No tasks yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {(recentTasks ?? []).map(task => {
                const project = (task.project as unknown) as { id: string; name: string; color: string } | null
                return (
                  <Link
                    key={task.id}
                    href={project ? `/admin/projects/${project.id}/tasks/${task.id}` : '#'}
                    className="flex items-center gap-2.5 py-1.5 hover:bg-slate-50 rounded-lg px-1.5 -mx-1.5 group transition-colors"
                  >
                    {project && (
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                    )}
                    <span className="text-sm text-slate-700 group-hover:text-indigo-600 flex-1 truncate transition-colors">
                      {task.title}
                    </span>
                    <TaskStatusBadge status={task.status as TaskStatus} />
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
