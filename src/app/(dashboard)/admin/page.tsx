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

  const today = new Date().toISOString().split('T')[0]
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {overdueCount > 0
              ? `${overdueCount} overdue task${overdueCount !== 1 ? 's' : ''} need attention`
              : 'Plan, prioritize, and accomplish your tasks with ease.'}
          </p>
        </div>
        <Link
          href="/admin/projects/new"
          className="flex items-center gap-2 bg-[#f24a49] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#e03e3d] transition-colors shrink-0"
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
          className="bg-[#1C1C1E] rounded-xl p-5 hover:opacity-90 transition-opacity flex flex-col justify-between min-h-[130px]"
        >
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-lg bg-[#f24a49] flex items-center justify-center">
              <FolderKanban className="w-4 h-4 text-white" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-white/30" />
          </div>
          <div>
            <div className="text-3xl font-bold text-white">{activeProjects}</div>
            <div className="text-sm text-white/50 mt-0.5">Active Projects</div>
          </div>
        </Link>

        {[
          { label: 'Active Tasks', value: activeTasks, icon: Clock },
          { label: 'In Review',    value: inReview,    icon: AlertCircle },
          { label: 'Completed',    value: completedCount, icon: CheckCircle2 },
        ].map(s => {
          const Icon = s.icon
          return (
            <Link
              key={s.label}
              href="/admin/projects"
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

      {/* Chart + Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Task Activity Chart */}
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

        {/* Recent Projects */}
        <div className="bg-card border border-border rounded-xl p-5">
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
              <FolderKanban className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">No projects yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projectProgress.map(p => (
                <Link key={p.id} href={`/admin/projects/${p.id}`} className="flex items-center gap-3 group">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: p.color + '22' }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  </div>
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
        <div className="bg-card border border-border rounded-xl p-5">
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
              <Users className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">No team members yet</p>
              <Link href="/admin/workspace" className="text-xs text-[#f24a49] mt-1 hover:underline">
                Invite a freelancer
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {teamData.map(member => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#f24a49] flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">
                      {(member.full_name || member.username || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {member.full_name || member.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.currentTask ? `Working on ${member.currentTask.title}` : 'No active task'}
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
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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
