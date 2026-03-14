import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  FolderKanban, CheckCircle2, Clock, AlertCircle,
  ArrowUpRight, Plus, Users, TrendingUp, ArrowRight,
} from 'lucide-react'
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
    supabase.from('projects').select('id, name, color, status, avatar_url').order('created_at', { ascending: false }).limit(20),
    supabase.from('tasks').select('id, title, status, due_date, created_at, project:projects(id, name, color), assignee:profiles!assigned_to(id, full_name, avatar_url)'),
    supabase.from('profiles').select('id, full_name, avatar_url, username').eq('role', 'freelancer').eq('status', 'active').limit(20),
  ])

  const tasks = allTasks ?? []
  const activeProjects = projectsList?.length ?? 0
  const activeTasks = tasks.filter(t => t.status !== 'completed').length
  const inReview = tasks.filter(t => t.status === 'review').length
  const completedCount = tasks.filter(t => t.status === 'completed').length
  const overdueCount = tasks.filter(t => isOverdue(t.due_date) && t.status !== 'completed').length

  // Weekly chart data
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
  const totalWeeklyTasks = weeklyData.reduce((a, b) => a + b, 0)

  // Project progress
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
    { label: 'Active Tasks',  value: activeTasks,    icon: Clock,        accent: '#3b82f6', iconBg: 'bg-blue-50 dark:bg-blue-900/30',   iconColor: 'text-blue-500' },
    { label: 'In Review',     value: inReview,        icon: AlertCircle,  accent: '#f59e0b', iconBg: 'bg-amber-50 dark:bg-amber-900/30', iconColor: 'text-amber-500' },
    { label: 'Completed',     value: completedCount,  icon: CheckCircle2, accent: '#10b981', iconBg: 'bg-emerald-50 dark:bg-emerald-900/30', iconColor: 'text-emerald-500' },
  ]

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className={`text-sm mt-0.5 ${overdueCount > 0 ? 'text-[#f24a49] font-medium' : 'text-muted-foreground'}`}>
            {overdueCount > 0
              ? `⚠ ${overdueCount} overdue task${overdueCount !== 1 ? 's' : ''} need attention`
              : 'Plan, prioritize, and accomplish your tasks with ease.'}
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="flex items-center gap-2 bg-[#f24a49] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#e03e3d] transition-colors shrink-0"
          style={{ boxShadow: '0 4px 14px rgba(242,74,73,0.3)' }}
        >
          <Plus className="w-4 h-4" />
          Add Project
        </Link>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Featured — Active Projects */}
        <Link
          href="/admin/projects"
          className="relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between min-h-[130px] hover:opacity-95 transition-all duration-200 col-span-1"
          style={{
            background: 'linear-gradient(135deg, #1C1C1E 0%, #2c2c2e 100%)',
            boxShadow: '0 8px 28px rgba(242,74,73,0.20)',
          }}
        >
          <div className="absolute inset-0 opacity-[0.15]"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
          <div className="relative flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#f24a49] flex items-center justify-center shadow-lg">
              <FolderKanban className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <ArrowUpRight className="w-4 h-4 text-white/30" />
          </div>
          <div className="relative">
            <p className="text-3xl font-bold text-white tabular-nums">{activeProjects}</p>
            <p className="text-xs text-white/50 mt-1 font-medium">Active Projects</p>
          </div>
          {/* Red glow line at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f24a49]/60 to-transparent" />
        </Link>

        {/* Other stat cards */}
        {statCards.map(s => {
          const Icon = s.icon
          return (
            <Link
              key={s.label}
              href="/admin/projects"
              className="relative bg-card border border-border rounded-2xl p-5 flex flex-col justify-between min-h-[130px] overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
            >
              {/* Tinted top-right glow */}
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.07] pointer-events-none"
                style={{ backgroundColor: s.accent }} />
              <div className="relative flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                  <Icon className={`w-4.5 h-4.5 ${s.iconColor}`} style={{ width: 18, height: 18 }} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground/20" />
              </div>
              <div className="relative">
                <p className="text-3xl font-bold text-foreground tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</p>
              </div>
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-50 rounded-b-2xl"
                style={{ backgroundColor: s.accent }} />
            </Link>
          )
        })}
      </div>

      {/* ── Chart + Project Progress ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Task Activity Bar Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Task Activity</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{totalWeeklyTasks} tasks created this week</p>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border">Last 7 days</span>
          </div>

          {/* Chart area */}
          <div className="relative" style={{ height: 164 }}>
            {/* Horizontal grid lines */}
            {[0.75, 0.5, 0.25].map(frac => (
              <div
                key={frac}
                className="absolute left-0 right-0 border-t border-dashed border-border/60 pointer-events-none"
                style={{ bottom: `${frac * 104 + 28}px` }}
              />
            ))}

            {/* Bars */}
            <div className="absolute inset-0 flex items-end gap-1.5 sm:gap-2.5 pt-4">
              {weeklyData.map((count, i) => {
                const heightPct = (count / maxBar) * 100
                const isToday = i === 6
                const isHighest = count === maxBar && count > 0
                const isPrimary = isToday || isHighest
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold tabular-nums" style={{
                      color: isPrimary ? '#f24a49' : 'transparent',
                      minHeight: 14,
                      visibility: count > 0 ? 'visible' : 'hidden',
                    }}>
                      {count}
                    </span>
                    <div className="w-full flex items-end" style={{ height: 104 }}>
                      <div
                        className="w-full rounded-t-md transition-all duration-700"
                        style={{
                          height: `${Math.max(heightPct, 5)}%`,
                          background: isPrimary
                            ? 'linear-gradient(180deg, #f24a49 0%, #c73b3a 100%)'
                            : count > 0
                            ? 'linear-gradient(180deg, oklch(0.75 0 0) 0%, oklch(0.68 0 0) 100%)'
                            : 'oklch(0.93 0 0 / 0.5)',
                          boxShadow: isPrimary ? '0 -2px 8px rgba(242,74,73,0.3)' : 'none',
                        }}
                      />
                    </div>
                    <span className={`text-[11px] ${isToday ? 'font-bold text-[#f24a49]' : 'text-muted-foreground'}`}>
                      {weekLabels[i]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Project Progress */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Project Progress</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{completedProjects.length} of {projectProgress.length} complete</p>
            </div>
            <Link href="/admin/projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
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
            <div className="space-y-4">
              {projectProgress.slice(0, 5).map(p => (
                <Link key={p.id} href={`/admin/projects/${p.id}`} className="block group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {(p as any).avatar_url ? (
                        <img src={(p as any).avatar_url} className="w-5 h-5 rounded-full object-cover shrink-0" alt="" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      )}
                      <span className="text-xs font-medium text-foreground truncate group-hover:text-[#f24a49] transition-colors">
                        {p.name}
                      </span>
                    </div>
                    <span className={`text-xs font-bold tabular-nums shrink-0 ml-2 ${p.pct === 100 ? 'text-emerald-500' : 'text-foreground'}`}>
                      {p.pct}%
                    </span>
                  </div>
                  {/* Segmented progress bar */}
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden flex gap-px">
                    {p.pct === 100 ? (
                      <div className="h-full bg-emerald-500 rounded-full w-full" />
                    ) : (
                      <>
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(p.done / p.total) * 100}%` }} />
                        <div className="h-full bg-amber-400 transition-all" style={{ width: `${(p.rev / p.total) * 100}%` }} />
                        <div className="h-full bg-blue-400 transition-all" style={{ width: `${(p.inProg / p.total) * 100}%` }} />
                      </>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{p.done}/{p.total} tasks done</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Team + Delivered Work ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Team */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Team</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{teamData.length} active member{teamData.length !== 1 ? 's' : ''}</p>
            </div>
            <Link
              href="/admin/workspace"
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted hover:text-foreground transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Member
            </Link>
          </div>

          {teamData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-semibold text-foreground">No team members yet</p>
              <Link href="/admin/workspace" className="text-xs text-[#f24a49] mt-1.5 hover:underline font-medium">
                Invite a freelancer →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {teamData.map(member => (
                <div key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-9 h-9 rounded-full bg-[#f24a49] flex items-center justify-center shrink-0 text-xs font-bold text-white overflow-hidden ring-2 ring-card">
                    {(member as any).avatar_url
                      ? <img src={(member as any).avatar_url} alt={member.full_name ?? ''} className="w-full h-full object-cover" />
                      : (member.full_name || member.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{member.full_name || member.username}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.currentTask
                        ? <><span className="text-muted-foreground">On </span><span className="font-medium text-foreground">{member.currentTask.title}</span></>
                        : <span className="italic">No active task</span>}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {member.currentTask && (
                      <TaskStatusBadge status={member.currentTask.status as TaskStatus} />
                    )}
                    {member.totalCount > 0 && (
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {member.completedCount}/{member.totalCount} done
                      </span>
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
            <div className="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
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
                  <div className="w-9 h-9 rounded-full bg-[#f24a49] flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden ring-2 ring-card">
                    {(f as any).avatar_url
                      ? <img src={(f as any).avatar_url} alt={f.full_name ?? ''} className="w-full h-full object-cover" />
                      : (f.full_name || f.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-semibold text-foreground truncate">{f.full_name || f.username}</p>
                      <span className={`text-[11px] font-bold shrink-0 ml-2 px-1.5 py-0.5 rounded-full ${
                        f.done > 0
                          ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'text-muted-foreground bg-muted'
                      }`}>
                        {f.done} done
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${f.pct}%`,
                          background: f.pct === 100
                            ? '#10b981'
                            : f.pct > 50
                            ? 'linear-gradient(90deg, #10b981, #3b82f6)'
                            : '#3b82f6',
                        }}
                      />
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
