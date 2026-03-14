import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FolderKanban, CheckCircle2, Clock, AlertCircle, ArrowUpRight, Plus, Users } from 'lucide-react'
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
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('tasks')
      .select('id, title, status, due_date, created_at, project:projects(id, name, color), assignee:profiles!assigned_to(id, full_name, avatar_url)'),
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, username')
      .eq('role', 'freelancer')
      .eq('status', 'active')
      .limit(20),
  ])

  const tasks = allTasks ?? []
  const activeProjects = projectsList?.length ?? 0
  const activeTasks = tasks.filter(t => t.status !== 'completed').length
  const inReview = tasks.filter(t => t.status === 'review').length
  const completedCount = tasks.filter(t => t.status === 'completed').length
  const overdueCount = tasks.filter(t => isOverdue(t.due_date) && t.status !== 'completed').length

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

  const projectProgress = (projectsList ?? []).map(p => {
    const pt = tasks.filter(t => (t.project as any)?.id === p.id)
    const done = pt.filter(t => t.status === 'completed').length
    return { ...p, done, total: pt.length, pct: pt.length > 0 ? Math.round((done / pt.length) * 100) : 0 }
  })

  const teamData = (freelancers ?? []).map(f => ({
    ...f,
    currentTask: tasks.find(t => (t.assignee as any)?.id === f.id && t.status !== 'completed') ?? null,
  }))

  const freelancerOutput = (freelancers ?? []).map(f => {
    const myTasks = tasks.filter(t => (t.assignee as any)?.id === f.id)
    const done = myTasks.filter(t => t.status === 'completed').length
    const total = myTasks.length
    return { ...f, done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
  }).sort((a, b) => b.done - a.done)

  const completedProjects = projectProgress.filter(p => p.total > 0 && p.pct === 100)

  const statCards = [
    {
      label: 'Active Tasks',
      value: activeTasks,
      icon: Clock,
      iconClass: 'bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400',
      accent: '#3b82f6',
    },
    {
      label: 'In Review',
      value: inReview,
      icon: AlertCircle,
      iconClass: 'bg-amber-50 text-amber-500 dark:bg-amber-900/20 dark:text-amber-400',
      accent: '#f59e0b',
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: CheckCircle2,
      iconClass: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400',
      accent: '#10b981',
    },
  ]

  return (
    <div className="space-y-6 dashboard-page">
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
          className="flex items-center gap-2 bg-[#f24a49] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#e03e3d] transition-colors shrink-0"
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
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-white/25" />
          </div>
          <div className="relative">
            <div className="text-4xl font-bold text-white tracking-tight tabular-nums">{activeProjects}</div>
            <div className="text-sm text-white/50 mt-1">Active Projects</div>
          </div>
        </Link>

        {statCards.map(s => {
          const Icon = s.icon
          return (
            <Link
              key={s.label}
              href="/admin/projects"
              className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 min-h-[140px] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              style={{ borderTop: `3px solid ${s.accent}`, boxShadow: 'var(--shadow-card)' }}
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground/25" />
              </div>
              <div>
                <div className="text-4xl font-bold text-foreground tracking-tight tabular-nums">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Chart + Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Task Activity Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold text-foreground">Task Activity</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">Last 7 days</span>
          </div>
          <div className="flex items-end gap-2 sm:gap-3" style={{ height: '160px' }}>
            {weeklyData.map((count, i) => {
              const heightPct = (count / maxBar) * 100
              const isToday = i === 6
              const isHighest = count === maxBar && count > 0
              const isPrimary = isToday || isHighest
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <span
                    className="text-[10px] font-semibold text-foreground tabular-nums"
                    style={{ minHeight: '14px', visibility: count > 0 ? 'visible' : 'hidden' }}
                  >
                    {count}
                  </span>
                  <div className="w-full flex items-end" style={{ height: '108px' }}>
                    <div
                      className="w-full rounded-lg transition-all duration-500"
                      style={{
                        height: `${Math.max(heightPct, 4)}%`,
                        background: isPrimary
                          ? 'linear-gradient(180deg, #f24a49 0%, #d93d3c 100%)'
                          : count > 0
                          ? 'linear-gradient(180deg, oklch(0.78 0 0) 0%, oklch(0.70 0 0) 100%)'
                          : 'oklch(0.93 0 0)',
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{weekLabels[i]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Delivered Work */}
        <div className="bg-card border border-border rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Delivered Work</h2>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          {freelancerOutput.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-foreground">No freelancers yet</p>
              <p className="text-xs text-muted-foreground mt-1">Invite team members to see delivery stats</p>
            </div>
          ) : (
            <div className="space-y-3">
              {freelancerOutput.map(f => (
                <div key={f.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#f24a49] flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                    {(f as any).avatar_url
                      ? <img src={(f as any).avatar_url} alt={f.full_name ?? ''} className="w-full h-full object-cover" />
                      : (f.full_name || f.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground truncate">{f.full_name || f.username}</p>
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-1.5 py-0.5 rounded-full shrink-0 ml-2">
                        {f.done} done
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${f.pct}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {f.total > 0 ? `${f.pct}% of ${f.total} assigned` : 'No tasks assigned'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team + Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Team Collaboration */}
        <div className="bg-card border border-border rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
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
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
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
                  <div className="w-9 h-9 rounded-full bg-[#f24a49] flex items-center justify-center shrink-0 text-xs font-bold text-white overflow-hidden">
                    {(member as any).avatar_url
                      ? <img src={(member as any).avatar_url} alt={member.full_name ?? ''} className="w-full h-full object-cover" />
                      : (member.full_name || member.username || 'U').charAt(0).toUpperCase()}
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

        {/* Completed Projects */}
        <div className="bg-card border border-border rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-foreground">Completed Projects</h2>
            {completedProjects.length > 0 && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                {completedProjects.length} done
              </span>
            )}
          </div>
          {completedProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <FolderKanban className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-foreground">No completed projects</p>
              <p className="text-xs text-muted-foreground mt-1">Projects with all tasks done will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completedProjects.map(p => {
                const contributors = (freelancers ?? []).filter(f =>
                  tasks.some(t => (t.assignee as any)?.id === f.id && (t.project as any)?.id === p.id)
                )
                return (
                  <Link
                    key={p.id}
                    href={`/admin/projects/${p.id}`}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors group"
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate group-hover:text-[#f24a49] transition-colors">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {p.total} task{p.total !== 1 ? 's' : ''} completed
                        {contributors.length > 0 && ` · ${contributors.map(c => c.full_name?.split(' ')[0] ?? c.username).join(', ')}`}
                      </p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
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
