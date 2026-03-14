import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FolderKanban, CheckCircle2, Clock, AlertCircle, ArrowUpRight, Plus, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { isOverdue } from '@/lib/utils/date'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import type { TaskStatus } from '@/lib/types/app.types'

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()

  const [
    { data: projectsList },
    { data: allTasks },
    { data: freelancers },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, color, status')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('tasks')
      .select('id, title, status, due_date, created_at, project:projects(id, name, color), assignee:profiles!assigned_to(id, full_name, avatar_url)'),
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, username')
      .eq('role', 'freelancer')
      .eq('status', 'active')
      .limit(5),
  ])

  const tasks = allTasks ?? []
  const activeProjects = projectsList?.length ?? 0
  const activeTasks = tasks.filter(t => t.status !== 'completed').length
  const inReview = tasks.filter(t => t.status === 'review').length
  const completedCount = tasks.filter(t => t.status === 'completed').length
  const overdueCount = tasks.filter(t => isOverdue(t.due_date) && t.status !== 'completed').length

  // Weekly task activity (last 7 days, index 0 = 6 days ago, index 6 = today)
  const weeklyData = Array(7).fill(0)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weekLabels: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    weekLabels.push(dayNames[d.getDay()])
  }
  tasks.forEach(t => {
    if (!t.created_at) return
    const diffDays = Math.floor((now.getTime() - new Date(t.created_at).getTime()) / 86400000)
    if (diffDays >= 0 && diffDays < 7) weeklyData[6 - diffDays]++
  })
  const maxBar = Math.max(...weeklyData, 1)

  // Project progress
  const projectProgress = (projectsList ?? []).map(p => {
    const pt = tasks.filter(t => (t.project as any)?.id === p.id)
    const done = pt.filter(t => t.status === 'completed').length
    return { ...p, done, total: pt.length, pct: pt.length > 0 ? Math.round((done / pt.length) * 100) : 0 }
  })

  // Team: freelancers + their current task
  const teamData = (freelancers ?? []).map(f => ({
    ...f,
    currentTask: tasks.find(t => (t.assignee as any)?.id === f.id && t.status !== 'completed') ?? null,
  }))

  const statCards = [
    {
      label: 'Active Tasks',
      value: activeTasks,
      icon: Clock,
      iconClass: 'bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400',
    },
    {
      label: 'In Review',
      value: inReview,
      icon: AlertCircle,
      iconClass: 'bg-amber-50 text-amber-500 dark:bg-amber-900/20 dark:text-amber-400',
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: CheckCircle2,
      iconClass: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400',
    },
  ]

  return (
    <div className="space-y-5 dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className={`text-sm mt-0.5 ${overdueCount > 0 ? 'text-[#f24a49] font-medium' : 'text-muted-foreground'}`}>
            {overdueCount > 0
              ? `${overdueCount} overdue task${overdueCount !== 1 ? 's' : ''} need attention`
              : 'Plan, prioritize, and accomplish your tasks with ease.'}
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="flex items-center gap-2 bg-[#f24a49] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#e03e3d] transition-colors shrink-0"
          style={{ boxShadow: 'var(--shadow-primary)' }}
        >
          <Plus className="w-4 h-4" />
          Add Project
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Featured card */}
        <Link
          href="/admin/projects"
          className="rounded-xl p-5 hover:opacity-90 transition-all duration-200 flex flex-col justify-between min-h-[130px]"
          style={{
            background: 'linear-gradient(135deg, #1C1C1E 0%, #2a2a2c 100%)',
            boxShadow: '0 4px 14px rgba(242,74,73,0.15)',
          }}
        >
          <div className="flex items-start justify-between">
            <div
              className="w-9 h-9 rounded-lg bg-[#f24a49] flex items-center justify-center"
              style={{ boxShadow: '0 2px 8px rgba(242,74,73,0.4)' }}
            >
              <FolderKanban className="w-4 h-4 text-white" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-white/30" />
          </div>
          <div>
            <div className="text-3xl font-bold text-white">{activeProjects}</div>
            <div className="text-sm text-white/50 mt-0.5">Active Projects</div>
          </div>
        </Link>

        {statCards.map(s => {
          const Icon = s.icon
          return (
            <Link
              key={s.label}
              href="/admin/projects"
              className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between min-h-[130px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-start justify-between">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.iconClass}`}>
                  <Icon className="w-4 h-4" />
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

      {/* Chart + Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Task Activity Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-foreground">Task Activity</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Last 7 days</span>
          </div>
          <div className="flex items-end gap-2 sm:gap-3" style={{ height: '140px' }}>
            {weeklyData.map((count, i) => {
              const heightPct = (count / maxBar) * 100
              const isToday = i === 6
              const isHighest = count === maxBar && count > 0
              const isPrimary = isToday || isHighest
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span
                    className="text-[10px] font-semibold text-foreground"
                    style={{ minHeight: '14px', visibility: count > 0 ? 'visible' : 'hidden' }}
                  >
                    {count}
                  </span>
                  <div className="w-full flex items-end" style={{ height: '96px' }}>
                    <div
                      className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${Math.max(heightPct, 4)}%`,
                        background: isPrimary
                          ? 'linear-gradient(180deg, #f24a49 0%, #d93d3c 100%)'
                          : undefined,
                        backgroundColor: !isPrimary ? (count > 0 ? 'oklch(0.75 0 0)' : 'oklch(0.93 0 0)') : undefined,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{weekLabels[i]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Projects</h2>
            <Link
              href="/admin/projects/new"
              className="flex items-center gap-1 text-xs text-muted-foreground border border-border rounded-lg px-2.5 py-1 hover:bg-muted transition-colors"
            >
              <Plus className="w-3 h-3" /> New
            </Link>
          </div>
          {projectProgress.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                <FolderKanban className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-foreground">No projects yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first project to get started</p>
            </div>
          ) : (
            <div className="space-y-1">
              {projectProgress.map(p => (
                <Link
                  key={p.id}
                  href={`/admin/projects/${p.id}`}
                  className="flex items-center gap-3 group px-2 py-2 rounded-lg hover:bg-muted transition-colors -mx-2"
                >
                  <div
                    className="w-1.5 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-[#f24a49] transition-colors">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.total} task{p.total !== 1 ? 's' : ''} · {p.pct}% done</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team + Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Team Collaboration */}
        <div className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Team</h2>
            <Link
              href="/admin/workspace"
              className="flex items-center gap-1 text-xs text-muted-foreground border border-border rounded-lg px-2.5 py-1 hover:bg-muted transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Member
            </Link>
          </div>
          {teamData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-foreground">No team members yet</p>
              <Link href="/admin/workspace" className="text-xs text-[#f24a49] mt-1 hover:underline">
                Invite a freelancer
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {teamData.map(member => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#f24a49] flex items-center justify-center shrink-0 text-xs font-bold text-white">
                    {(member.full_name || member.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {member.full_name || member.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.currentTask
                        ? <>Working on <span className="font-medium text-foreground">{member.currentTask.title}</span></>
                        : 'No active task'}
                    </p>
                  </div>
                  {member.currentTask && (
                    <TaskStatusBadge status={member.currentTask.status as TaskStatus} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Progress */}
        <div className="bg-card border border-border rounded-xl p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Project Progress</h2>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          {projectProgress.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-foreground">No projects yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add a project to track progress</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projectProgress.slice(0, 5).map(p => (
                <Link key={p.id} href={`/admin/projects/${p.id}`} className="block group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="text-sm font-medium text-foreground truncate max-w-[180px] group-hover:text-[#f24a49] transition-colors">
                        {p.name}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground ml-2 shrink-0">{p.pct}%</span>
                  </div>
                  <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${p.pct}%`, backgroundColor: p.color }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
