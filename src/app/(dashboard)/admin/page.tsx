import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  FolderKanban, CheckCircle2, Clock, AlertCircle,
  ArrowUpRight, Plus, Users, TrendingUp, TrendingDown, ArrowRight, MoreHorizontal,
} from 'lucide-react'
import Link from 'next/link'
import { isOverdue } from '@/lib/utils/date'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
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
    supabase.from('projects').select('id, name, color, status, avatar_url').order('created_at', { ascending: false }).limit(20),
    supabase.from('tasks').select('id, title, status, due_date, created_at, project:projects(id, name, color), assignee:profiles!assigned_to(id, full_name, avatar_url)').limit(500),
    supabase.from('profiles').select('id, full_name, avatar_url, username').eq('role', 'freelancer').eq('status', 'active').limit(20),
  ])

  const tasks = allTasks ?? []
  const activeProjects = projectsList?.length ?? 0
  const activeTasks = tasks.filter(t => t.status !== 'completed').length
  const inReview = tasks.filter(t => t.status === 'review').length
  const completedCount = tasks.filter(t => t.status === 'completed').length
  const overdueCount = tasks.filter(t => isOverdue(t.due_date) && t.status !== 'completed').length

  const weeklyData = Array(7).fill(0)
  const completedWeekly = Array(7).fill(0)
  const activeWeekly = Array(7).fill(0)
  const reviewWeekly = Array(7).fill(0)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const weekLabels: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    weekLabels.push(dayNames[d.getDay()])
  }
  tasks.forEach(t => {
    if (!t.created_at) return
    const diffDays = Math.floor((now.getTime() - new Date(t.created_at).getTime()) / 86400000)
    if (diffDays >= 0 && diffDays < 7) {
      const idx = 6 - diffDays
      weeklyData[idx]++
      if (t.status === 'completed') completedWeekly[idx]++
      else activeWeekly[idx]++
      if (t.status === 'review') reviewWeekly[idx]++
    }
  })
  const totalWeeklyTasks = weeklyData.reduce((a, b) => a + b, 0)

  const projectProgress = (projectsList ?? []).map(p => {
    const pt = tasks.filter(t => (t.project as any)?.id === p.id)
    const done = pt.filter(t => t.status === 'completed').length
    const inProg = pt.filter(t => t.status === 'in_progress').length
    const rev = pt.filter(t => t.status === 'review').length
    return { ...p, done, inProg, rev, total: pt.length, pct: pt.length > 0 ? Math.round((done / pt.length) * 100) : 0 }
  }).filter(p => p.total > 0)

  const completedProjects = projectProgress.filter(p => p.pct === 100)

  const teamData = (freelancers ?? []).map(f => ({
    ...f,
    currentTask: tasks.find(t => (t.assignee as any)?.id === f.id && t.status !== 'completed') ?? null,
    completedCount: tasks.filter(t => (t.assignee as any)?.id === f.id && t.status === 'completed').length,
    totalCount: tasks.filter(t => (t.assignee as any)?.id === f.id).length,
  }))

  const freelancerOutput = (freelancers ?? []).map(f => {
    const myTasks = tasks.filter(t => (t.assignee as any)?.id === f.id)
    const done = myTasks.filter(t => t.status === 'completed').length
    const total = myTasks.length
    return { ...f, done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 }
  }).sort((a, b) => b.done - a.done)

  const statCards = [
    {
      label: 'Active Tasks', value: activeTasks, icon: Clock, href: '/admin/projects',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', glow: 'rgba(99,102,241,0.35)', series: activeWeekly,
    },
    {
      label: 'In Review', value: inReview, icon: AlertCircle, href: '/admin/projects',
      gradient: 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)', glow: 'rgba(249,115,22,0.35)', series: reviewWeekly,
    },
    {
      label: 'Completed', value: completedCount, icon: CheckCircle2, href: '/admin/projects',
      gradient: 'linear-gradient(135deg, #34d399 0%, #059669 100%)', glow: 'rgba(16,185,129,0.35)', series: completedWeekly,
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <DashboardGreeting />
          <p className={`text-sm mt-0.5 ${overdueCount > 0 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            {overdueCount > 0
              ? `⚠ ${overdueCount} overdue task${overdueCount !== 1 ? 's' : ''} need attention`
              : 'Plan, prioritize, and accomplish your tasks with ease.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LiveClock />
          <Link
            href="/admin/projects/new"
            className="flex items-center gap-2 h-12 bg-primary text-primary-foreground text-sm font-semibold px-5 rounded-xl hover:opacity-90 transition-opacity shrink-0"
            style={{ boxShadow: 'var(--shadow-primary)' }}
          >
            <Plus className="w-4 h-4" /> Add Project
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Featured — dark card */}
        <Link
          href="/admin/projects"
          className="relative overflow-hidden rounded-3xl p-5 flex flex-col justify-between min-h-[140px] hover:opacity-95 transition-all duration-200"
          style={{ background: 'linear-gradient(135deg, #1C1C1E 0%, #2c2c2e 100%)', boxShadow: '0 8px 28px rgba(0,0,0,0.22)' }}
        >
          <div className="absolute inset-0 opacity-[0.14]"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
          <div className="relative flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center ring-1 ring-white/15">
              <FolderKanban style={{ width: 18, height: 18, color: 'white' }} />
            </div>
            <ArrowUpRight className="w-4 h-4 text-white/30" />
          </div>
          <div className="relative text-white/25 -mx-1">
            <MiniSparkline data={weeklyData} stroke="currentColor" width={120} height={24} className="w-full" />
          </div>
          <div className="relative">
            <p className="text-3xl font-bold text-white tabular-nums leading-none">{activeProjects}</p>
            <p className="text-xs text-white/50 mt-1.5 font-medium">Active Projects</p>
          </div>
        </Link>

        {/* Vibrant stat cards with sparklines */}
        {statCards.map(s => {
          const Icon = s.icon
          const trend = trendOf(s.series)
          const TrendIcon = trend.up ? TrendingUp : TrendingDown
          return (
            <Link
              key={s.label}
              href={s.href}
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

      {/* Chart + Project Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Task Activity — compact */}
        <div className="bg-card border border-border rounded-2xl p-5">
          {/* Header row with summary stats */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Task Activity</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Last 7 days</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xl font-bold text-foreground tabular-nums leading-none">{totalWeeklyTasks}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">created</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-right">
                <p className="text-xl font-bold text-emerald-500 tabular-nums leading-none">{completedCount}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">done</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span className="w-3 h-[2px] rounded-full bg-foreground" /> Created
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span className="w-3 border-t-2 border-dotted border-muted-foreground" /> Completed
            </span>
          </div>

          {/* Task flow chart */}
          <TaskFlowChart created={weeklyData} completed={completedWeekly} labels={weekLabels} />
        </div>

        {/* Project Progress */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Project Progress</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{completedProjects.length} of {projectProgress.length} complete</p>
            </div>
            <Link href="/admin/projects" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {projectProgress.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-foreground">No projects yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">Create a project to see progress</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projectProgress.slice(0, 4).map(p => (
                <Link key={p.id} href={`/admin/projects/${p.id}`} className="flex items-center gap-3 group">
                  {/* Avatar / color dot */}
                  <div
                    className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white text-[11px] font-bold overflow-hidden"
                    style={{ backgroundColor: p.color }}
                  >
                    {(p as any).avatar_url
                      ? <img src={(p as any).avatar_url} className="w-full h-full object-cover" alt="" />
                      : p.name.charAt(0).toUpperCase()}
                  </div>
                  {/* Bar + labels */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors leading-none">{p.name}</span>
                      <span className={`text-[11px] font-bold tabular-nums ml-2 shrink-0 ${p.pct === 100 ? 'text-emerald-500' : 'text-muted-foreground'}`}>{p.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${p.pct}%`,
                          background: p.pct === 100
                            ? '#10b981'
                            : p.pct > 60
                            ? 'linear-gradient(90deg,#3b82f6,#10b981)'
                            : '#3b82f6',
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{p.done}/{p.total} tasks</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team + Delivered Work */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Team */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Team</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{teamData.length} active member{teamData.length !== 1 ? 's' : ''}</p>
            </div>
            <Link href="/admin/workspace"
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted hover:text-foreground transition-colors">
              <Plus className="w-3 h-3" /> Add Member
            </Link>
          </div>
          {teamData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-semibold text-foreground">No team members yet</p>
              <Link href="/admin/workspace" className="text-xs text-primary mt-1.5 hover:underline font-medium">Invite a freelancer →</Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {teamData.map(member => (
                <div key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0 text-xs font-bold text-white overflow-hidden ring-2 ring-card">
                    {(member as any).avatar_url
                      ? <img src={(member as any).avatar_url} alt={member.full_name ?? ''} className="w-full h-full object-cover" />
                      : (member.full_name || member.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{member.full_name || member.username}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.currentTask
                        ? <><span>On </span><span className="font-medium text-foreground">{member.currentTask.title}</span></>
                        : <span className="italic">No active task</span>}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {member.currentTask && <TaskStatusBadge status={member.currentTask.status as TaskStatus} />}
                    {member.totalCount > 0 && (
                      <span className="text-[10px] text-muted-foreground tabular-nums">{member.completedCount}/{member.totalCount} done</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delivered Work */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Delivered Work</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Completion rate per freelancer</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          {freelancerOutput.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-semibold text-foreground">No freelancers yet</p>
              <p className="text-xs text-muted-foreground mt-1">Invite team members to see delivery stats</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {freelancerOutput.map(f => (
                <div key={f.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden ring-2 ring-card">
                    {(f as any).avatar_url
                      ? <img src={(f as any).avatar_url} alt={f.full_name ?? ''} className="w-full h-full object-cover" />
                      : (f.full_name || f.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-semibold text-foreground truncate">{f.full_name || f.username}</p>
                      <span className={`text-[11px] font-bold shrink-0 ml-2 px-1.5 py-0.5 rounded-full ${
                        f.done > 0
                          ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'text-muted-foreground bg-muted'
                      }`}>{f.done} done</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{
                        width: `${f.pct}%`,
                        background: f.pct === 100 ? '#10b981' : f.pct > 50 ? 'linear-gradient(90deg,#10b981,#3b82f6)' : '#3b82f6',
                      }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {f.total > 0 ? `${f.pct}% of ${f.total} assigned` : 'No tasks assigned'}
                    </p>
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
