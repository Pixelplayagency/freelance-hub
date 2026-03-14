import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import { CheckCircle2, Clock, ListTodo, AlertTriangle, ArrowUpRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { isOverdue } from '@/lib/utils/date'
import type { TaskStatus } from '@/lib/types/app.types'

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
  const { data: { user } } = await supabase.auth.getUser()
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
      gradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
      glow: 'rgba(59,130,246,0.25)',
      iconBg: 'rgba(255,255,255,0.18)',
    },
    {
      label: 'In Review', value: inReview, icon: AlertTriangle,
      gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      glow: 'rgba(245,158,11,0.25)',
      iconBg: 'rgba(255,255,255,0.18)',
    },
    {
      label: 'Completed', value: completed, icon: CheckCircle2,
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      glow: 'rgba(16,185,129,0.25)',
      iconBg: 'rgba(255,255,255,0.18)',
    },
  ]

  return (
    <div className="space-y-6 dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Dashboard</h1>
        <p className={`text-sm mt-0.5 ${overdueCount > 0 ? 'text-[#f24a49] font-medium' : 'text-muted-foreground'}`}>
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
          className="relative overflow-hidden rounded-2xl p-6 hover:opacity-90 transition-all duration-200 flex flex-col gap-4 min-h-[140px]"
          style={{
            background: 'linear-gradient(135deg, #1C1C1E 0%, #2a2a2c 100%)',
            boxShadow: '0 4px 24px rgba(242,74,73,0.18)',
          }}
        >
          {/* Dot grid overlay */}
          <div
            className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />
          <div className="relative flex items-start justify-between">
            <div
              className="w-10 h-10 rounded-xl bg-[#f24a49] flex items-center justify-center"
              style={{ boxShadow: '0 2px 10px rgba(242,74,73,0.5)' }}
            >
              <ListTodo className="w-5 h-5 text-white" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-white/25" />
          </div>
          <div className="relative">
            <div className="text-4xl font-bold text-white tracking-tight tabular-nums">{todo}</div>
            <div className="text-sm text-white/50 mt-1">To Do</div>
          </div>
        </Link>

        {statCards.map(s => {
          const Icon = s.icon
          return (
            <Link
              key={s.label}
              href="/freelancer/tasks"
              className="relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between min-h-[130px] hover:-translate-y-0.5 transition-all duration-200"
              style={{
                background: s.gradient,
                boxShadow: `0 4px 20px ${s.glow}`,
              }}
            >
              <div
                className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.35) 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              />
              <div className="relative flex items-center justify-between">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: s.iconBg }}
                >
                  <Icon className="text-white" style={{ width: 18, height: 18 }} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-white/30" />
              </div>
              <div className="relative">
                <p className="text-3xl font-bold tabular-nums text-white">{s.value}</p>
                <p className="text-xs mt-1 font-medium text-white/70">{s.label}</p>
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
          <div className="flex items-end gap-1" style={{ height: 80 }}>
            {weeklyData.map((count, i) => {
              const heightPct = (count / maxBar) * 100
              const isToday = i === 6
              const isPrimary = isToday || (count === maxBar && count > 0)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end" style={{ height: 58 }}>
                    <div
                      className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${Math.max(heightPct, count > 0 ? 8 : 4)}%`,
                        background: isPrimary
                          ? 'linear-gradient(180deg, #f24a49 0%, #c73b3a 100%)'
                          : count > 0
                          ? 'linear-gradient(180deg, #93c5fd 0%, #60a5fa 100%)'
                          : 'var(--muted)',
                        boxShadow: isPrimary ? '0 -2px 8px rgba(242,74,73,0.3)' : 'none',
                      }}
                    />
                  </div>
                  <span className={`text-[10px] leading-none ${isToday ? 'font-bold text-[#f24a49]' : 'text-muted-foreground'}`}>
                    {weekLabels[i].slice(0, 2)}
                  </span>
                </div>
              )
            })}
          </div>
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
                    <span className="text-xs font-medium text-foreground group-hover:text-[#f24a49] flex-1 truncate transition-colors">
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
