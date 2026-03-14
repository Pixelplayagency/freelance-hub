import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import { CheckCircle2, Clock, ListTodo, AlertTriangle, ArrowUpRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { isOverdue } from '@/lib/utils/date'
import type { TaskStatus } from '@/lib/types/app.types'

export default async function FreelancerDashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const now = new Date()

  // Fetch task IDs from co-assignments
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
  const todo = allTasks.filter(t => t.status === 'todo').length
  const inProgress = allTasks.filter(t => t.status === 'in_progress').length
  const inReview = allTasks.filter(t => t.status === 'review').length
  const completed = allTasks.filter(t => t.status === 'completed').length
  const overdueCount = allTasks.filter(t => isOverdue(t.due_date) && t.status !== 'completed').length

  const tasksDueToday = allTasks.filter(t =>
    t.due_date && t.due_date.startsWith(today) && t.status !== 'completed'
  )
  const activeTasks = allTasks.filter(t => t.status !== 'completed')

  // Weekly activity (last 7 days)
  const weeklyData = Array(7).fill(0)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weekLabels: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    weekLabels.push(dayNames[d.getDay()])
  }
  allTasks.forEach(t => {
    if (!t.created_at) return
    const diffDays = Math.floor((now.getTime() - new Date(t.created_at).getTime()) / 86400000)
    if (diffDays >= 0 && diffDays < 7) weeklyData[6 - diffDays]++
  })
  const maxBar = Math.max(...weeklyData, 1)

  // Project progress grouping
  const projectMap: Record<string, { name: string; color: string; done: number; total: number; id: string }> = {}
  allTasks.forEach(t => {
    const p = t.project as { id: string; name: string; color: string } | null
    if (!p) return
    if (!projectMap[p.id]) projectMap[p.id] = { id: p.id, name: p.name, color: p.color, done: 0, total: 0 }
    projectMap[p.id].total++
    if (t.status === 'completed') projectMap[p.id].done++
  })
  const projectProgress = Object.values(projectMap).map(p => ({
    ...p,
    pct: p.total > 0 ? Math.round((p.done / p.total) * 100) : 0,
  }))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {overdueCount > 0
            ? `${overdueCount} overdue task${overdueCount !== 1 ? 's' : ''} need attention`
            : `${allTasks.length} task${allTasks.length !== 1 ? 's' : ''} assigned to you`}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Featured card */}
        <Link
          href="/freelancer/tasks"
          className="bg-[#1C1C1E] rounded-xl p-5 hover:opacity-90 transition-opacity flex flex-col justify-between min-h-[130px]"
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-lg bg-[#f24a49] flex items-center justify-center">
              <ListTodo className="w-4 h-4 text-white" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-white/30" />
          </div>
          <div>
            <div className="text-3xl font-bold text-white">{todo}</div>
            <div className="text-sm text-white/50 mt-0.5">To Do</div>
          </div>
        </Link>

        {[
          { label: 'In Progress', value: inProgress, icon: Clock },
          { label: 'In Review',   value: inReview,   icon: AlertTriangle },
          { label: 'Completed',   value: completed,  icon: CheckCircle2 },
        ].map(s => {
          const Icon = s.icon
          return (
            <Link
              key={s.label}
              href="/freelancer/tasks"
              className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow flex flex-col justify-between min-h-[130px]"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground/30" />
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Chart + Due Today */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-foreground">Task Activity</h2>
            <span className="text-xs text-muted-foreground">Last 7 days</span>
          </div>
          <div className="flex items-end gap-2 sm:gap-3" style={{ height: '120px' }}>
            {weeklyData.map((count, i) => {
              const heightPct = (count / maxBar) * 100
              const isToday = i === 6
              const isHighest = count === maxBar && count > 0
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end" style={{ height: '88px' }}>
                    <div
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        height: `${Math.max(heightPct, 5)}%`,
                        backgroundColor: isToday || isHighest ? '#f24a49' : count > 0 ? '#1C1C1E' : '#e5e7eb',
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{weekLabels[i]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Due Today */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-foreground">Due Today</h2>
            {tasksDueToday.length > 0 && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                {tasksDueToday.length}
              </span>
            )}
          </div>
          {tasksDueToday.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">No tasks due today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasksDueToday.map(task => {
                const project = task.project as { id: string; name: string; color: string } | null
                return (
                  <Link
                    key={task.id}
                    href={`/freelancer/tasks/${task.id}`}
                    className="flex items-center gap-2 py-1 group"
                  >
                    <TaskStatusBadge status={task.status as TaskStatus} />
                    <span className="text-sm text-foreground flex-1 truncate group-hover:text-[#f24a49] transition-colors">
                      {task.title}
                    </span>
                    {project && (
                      <span className="text-xs text-muted-foreground shrink-0 truncate max-w-[70px]">{project.name}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Active Tasks + Project Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Active Tasks */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Active Tasks</h2>
          {activeTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activeTasks.slice(0, 7).map(task => {
                const project = task.project as { id: string; name: string; color: string } | null
                return (
                  <Link
                    key={task.id}
                    href={`/freelancer/tasks/${task.id}`}
                    className="flex items-center gap-2.5 py-1.5 hover:bg-muted rounded-lg px-1.5 -mx-1.5 group transition-colors"
                  >
                    {project && (
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                    )}
                    <span className="text-sm text-foreground group-hover:text-[#f24a49] flex-1 truncate transition-colors">
                      {task.title}
                    </span>
                    <TaskStatusBadge status={task.status as TaskStatus} />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Project Progress */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Project Progress</h2>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          {projectProgress.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <TrendingUp className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">No projects yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projectProgress.slice(0, 5).map(p => (
                <div key={p.id} className="block">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="text-sm font-medium text-foreground truncate max-w-[180px]">{p.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground ml-2 shrink-0">{p.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${p.pct}%`, backgroundColor: p.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
