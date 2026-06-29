import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import { CheckCircle2, Clock, ListTodo, AlertTriangle, ArrowUpRight, TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { isOverdue } from '@/lib/utils/date'
import { MiniSparkline } from '@/components/dashboard/MiniSparkline'
import { TaskFlowChart } from '@/components/dashboard/TaskFlowChart'
import { LiveClock } from '@/components/dashboard/LiveClock'
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import type { TaskStatus } from '@/lib/types/app.types'

function trendOf(series: number[]) {
  const older = series.slice(0, 3).reduce((a, b) => a + b, 0)
  const recent = series.slice(4).reduce((a, b) => a + b, 0)
  const pct = older > 0 ? Math.round(((recent - older) / older) * 100) : recent > 0 ? 100 : 0
  return { pct, up: pct >= 0 }
}

const RING_R = 26
const RING_CIRC = 2 * Math.PI * RING_R

function ProgressRing({ pct, color }: { pct: number; color: string }) {
  const offset = RING_CIRC * (1 - pct / 100)
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="34" cy="34" r={RING_R} fill="none" stroke="oklch(0.92 0 0)" strokeWidth="5" />
      <circle
        cx="34" cy="34" r={RING_R} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={RING_CIRC}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  )
}

export default async function FreelancerDashboardPage() {
  const supabase = await createSupabaseServerClient()
  // Session already validated in (dashboard)/layout.tsx — read it from the cookie (no network call).
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const now = new Date()

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

  const weeklyData = Array(7).fill(0)
  const completedWeekly = Array(7).fill(0)
  const progressWeekly = Array(7).fill(0)
  const reviewWeekly = Array(7).fill(0)
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
    if (diffDays >= 0 && diffDays < 7) {
      const idx = 6 - diffDays
      weeklyData[idx]++
      if (t.status === 'completed') completedWeekly[idx]++
      if (t.status === 'in_progress') progressWeekly[idx]++
      if (t.status === 'review') reviewWeekly[idx]++
    }
  })

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

  const statCards = [
    {
      label: 'In Progress', value: inProgress, icon: Clock,
      gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', glow: 'rgba(99,102,241,0.35)', series: progressWeekly,
    },
    {
      label: 'In Review', value: inReview, icon: AlertTriangle,
      gradient: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)', glow: 'rgba(249,115,22,0.35)', series: reviewWeekly,
    },
    {
      label: 'Completed', value: completed, icon: CheckCircle2,
      gradient: 'linear-gradient(135deg, #34d399 0%, #059669 100%)', glow: 'rgba(16,185,129,0.35)', series: completedWeekly,
    },
  ]

  return (
    <div className="space-y-6 dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <DashboardGreeting />
          <p className={`text-sm mt-0.5 ${overdueCount > 0 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            {overdueCount > 0
              ? `${overdueCount} overdue task${overdueCount !== 1 ? 's' : ''} need attention`
              : `${allTasks.length} task${allTasks.length !== 1 ? 's' : ''} assigned to you`}
          </p>
        </div>
        <LiveClock />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Featured card */}
        <Link
          href="/freelancer/tasks"
          className="relative overflow-hidden rounded-3xl p-6 hover:opacity-90 transition-all duration-200 flex flex-col gap-3 min-h-[140px]"
          style={{
            background: 'linear-gradient(135deg, #1C1C1E 0%, #2a2a2c 100%)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
          }}
        >
          {/* Dot grid overlay */}
          <div
            className="absolute inset-0 rounded-3xl opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />
          <div className="relative flex items-start justify-between">
            <div
              className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center ring-1 ring-white/15"
            >
              <ListTodo className="w-5 h-5 text-white" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-white/25" />
          </div>
          <div className="relative text-white/25 -mx-1">
            <MiniSparkline data={weeklyData} stroke="currentColor" width={120} height={24} className="w-full" />
          </div>
          <div className="relative">
            <div className="text-4xl font-bold text-white tracking-tight tabular-nums leading-none">{todo}</div>
            <div className="text-sm text-white/50 mt-1.5">To Do</div>
          </div>
        </Link>

        {statCards.map(s => {
          const Icon = s.icon
          const trend = trendOf(s.series)
          const TrendIcon = trend.up ? TrendingUp : TrendingDown
          return (
            <Link
              key={s.label}
              href="/freelancer/tasks"
              className="relative overflow-hidden rounded-3xl p-5 flex flex-col justify-between min-h-[140px] text-white hover:-translate-y-0.5 transition-transform duration-200"
              style={{ background: s.gradient, boxShadow: `0 10px 30px ${s.glow}` }}
            >
              <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
              <div className="relative flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Icon className="text-white" style={{ width: 18, height: 18 }} />
                </div>
                <MoreHorizontal className="w-4 h-4 text-white/50" />
              </div>
              <div className="relative text-white/40 -mx-1">
                <MiniSparkline data={s.series} stroke="currentColor" width={120} height={28} className="w-full" />
              </div>
              <div className="relative flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold tabular-nums leading-none">{s.value}</p>
                  <p className="text-xs mt-1.5 font-medium text-white/70">{s.label}</p>
                </div>
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold bg-white/20 rounded-full px-2 py-0.5">
                  <TrendIcon className="w-3.5 h-3.5" />
                  {Math.abs(trend.pct)}%
                </span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Chart + Due Today */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Activity chart — compact */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Task Activity</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Last 7 days</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xl font-bold text-foreground tabular-nums leading-none">{allTasks.length}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">total</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-right">
                <p className="text-xl font-bold text-emerald-500 tabular-nums leading-none">{completed}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">done</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span className="w-3 h-[2px] rounded-full bg-foreground" /> Created
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span className="w-3 border-t-2 border-dotted border-muted-foreground" /> Completed
            </span>
          </div>
          <TaskFlowChart created={weeklyData} completed={completedWeekly} labels={weekLabels} />
        </div>

        {/* Due Today */}
        <div className="bg-card border border-border rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-foreground">Due Today</h2>
            {tasksDueToday.length > 0 && (
              <span className="text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-full dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800">
                {tasksDueToday.length}
              </span>
            )}
          </div>
          {tasksDueToday.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-foreground">All clear!</p>
              <p className="text-xs text-muted-foreground mt-1">No tasks due today</p>
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
                    <span className="text-sm text-foreground flex-1 truncate group-hover:text-primary transition-colors">
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
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Active Tasks</h2>
            {activeTasks.length > 0 && (
              <span className="text-[11px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full tabular-nums">
                {activeTasks.length}
              </span>
            )}
          </div>
          {activeTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">No active tasks right now</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {activeTasks.slice(0, 6).map(task => {
                const project = task.project as { id: string; name: string; color: string } | null
                const STATUS_LEFT: Record<string, string> = {
                  todo: 'border-l-slate-300',
                  in_progress: 'border-l-blue-400',
                  review: 'border-l-amber-400',
                  completed: 'border-l-emerald-400',
                }
                return (
                  <Link
                    key={task.id}
                    href={`/freelancer/tasks/${task.id}`}
                    className={`flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-muted border-l-[3px] ${STATUS_LEFT[task.status] ?? 'border-l-border'} bg-muted/40 group transition-colors`}
                  >
                    {project && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                    )}
                    <span className="text-xs font-medium text-foreground group-hover:text-primary flex-1 truncate transition-colors">
                      {task.title}
                    </span>
                    <TaskStatusBadge status={task.status as TaskStatus} />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Project Progress — clean list */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Project Progress</h2>
            <TrendingUp className="w-4 h-4 text-muted-foreground/50" />
          </div>
          {projectProgress.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-foreground">No projects yet</p>
              <p className="text-xs text-muted-foreground mt-1">Tasks will appear here once assigned</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projectProgress.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground truncate leading-none">{p.name}</span>
                      <span className={`text-[11px] font-bold tabular-nums ml-2 shrink-0 ${p.pct === 100 ? 'text-emerald-500' : 'text-muted-foreground'}`}>{p.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${p.pct}%`,
                          background: p.pct === 100
                            ? '#10b981'
                            : p.pct > 50
                            ? 'linear-gradient(90deg,#3b82f6,#10b981)'
                            : p.color,
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{p.done}/{p.total} tasks done</p>
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
