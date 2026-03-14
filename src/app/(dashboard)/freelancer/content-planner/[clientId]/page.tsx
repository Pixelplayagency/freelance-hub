import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ContentPlannerCalendar } from '@/components/content-planner/ContentPlannerCalendar'
import { ContentPlannerTaskView } from '@/components/content-planner/ContentPlannerTaskView'
import Link from 'next/link'
import { ChevronLeft, CalendarDays, CheckSquare } from 'lucide-react'
import type { ContentPlan, Task, Project } from '@/lib/types/app.types'

type TaskWithProject = Task & {
  project: Pick<Project, 'id' | 'name' | 'color' | 'avatar_url'> | null
}

export default async function FreelancerClientCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>
  searchParams: Promise<{ view?: string; month?: string; year?: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('job_role').eq('id', user.id).single()
  if (profile?.job_role !== 'social_media_manager') redirect('/freelancer')

  const { clientId } = await params
  const { data: client } = await supabase.from('content_clients').select('*').eq('id', clientId).single()
  if (!client) notFound()

  const sp = await searchParams
  const view = sp.view === 'task' ? 'task' : 'calendar'
  const now = new Date()
  const month = sp.month !== undefined ? parseInt(sp.month) : now.getMonth()
  const year = sp.year !== undefined ? parseInt(sp.year) : now.getFullYear()

  const basePath = `/freelancer/content-planner/${clientId}`

  // Fetch calendar entries only in calendar view
  let entries: ContentPlan[] = []
  if (view === 'calendar') {
    const startDate = new Date(year, month, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]
    const { data } = await supabase
      .from('content_plans')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
    entries = (data ?? []) as ContentPlan[]
  }

  // Fetch assigned tasks only in task view
  let userTasks: TaskWithProject[] = []
  if (view === 'task') {
    const { data: coAssigned } = await supabase
      .from('task_assignments').select('task_id').eq('user_id', user.id)
    const coIds = (coAssigned ?? []).map((r: { task_id: string }) => r.task_id)
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*, project:projects(id, name, color, avatar_url)')
      .or(`assigned_to.eq.${user.id}${coIds.length > 0 ? `,id.in.(${coIds.join(',')})` : ''}`)
      .order('due_date', { ascending: true, nullsFirst: false })
    userTasks = (tasks ?? []) as TaskWithProject[]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/freelancer/content-planner" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2 w-fit transition-colors">
            <ChevronLeft className="w-3 h-3" /> Content Planner
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {view === 'calendar' ? 'Monthly content schedule' : 'Your assigned tasks'}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-xl border border-border shrink-0">
          <Link
            href={`${basePath}?view=calendar&month=${month}&year=${year}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              view === 'calendar'
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Calendar
          </Link>
          <Link
            href={`${basePath}?view=task`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              view === 'task'
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Task
          </Link>
        </div>
      </div>

      {/* Content */}
      {view === 'calendar' ? (
        <ContentPlannerCalendar
          key={`${year}-${month}`}
          entries={entries}
          month={month}
          year={year}
          clientId={clientId}
          basePath={`${basePath}?view=calendar`}
          isAdmin={false}
        />
      ) : (
        <ContentPlannerTaskView tasks={userTasks} />
      )}
    </div>
  )
}
