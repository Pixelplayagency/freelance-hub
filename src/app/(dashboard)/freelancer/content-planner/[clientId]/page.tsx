import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ContentPlannerCalendar } from '@/components/content-planner/ContentPlannerCalendar'
import { ContentPlannerTaskView } from '@/components/content-planner/ContentPlannerTaskView'
import { ClientPlannerHeader } from '@/components/content-planner/ClientPlannerHeader'
import Link from 'next/link'
import { ChevronLeft, CheckSquare } from 'lucide-react'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import type { ContentPlan, ScheduleEntry, Task, Project, ContentShareLink } from '@/lib/types/app.types'

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
  // Session already validated in (dashboard)/layout.tsx — read it from the cookie (no network call).
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('job_role').eq('id', user.id).single()
  if (profile?.job_role !== 'social_media_manager') redirect('/freelancer')

  const { clientId } = await params
  const [{ data: client }, { data: shareLinks }] = await Promise.all([
    supabase.from('content_clients').select('*').eq('id', clientId).single(),
    supabase.from('content_share_links').select('*').eq('client_id', clientId).is('revoked_at', null).order('created_at', { ascending: false }),
  ])
  if (!client) notFound()

  const sp = await searchParams
  const view = sp.view === 'task' ? 'task' : 'calendar'
  const now = new Date()
  const month = sp.month !== undefined ? parseInt(sp.month) : now.getMonth()
  const year = sp.year !== undefined ? parseInt(sp.year) : now.getFullYear()

  const basePath = `/freelancer/content-planner/${clientId}`
  const startDate = new Date(year, month, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

  // Fetch calendar entries, task view data, and monthly stats in parallel
  const [calendarResult, tasksResult, statsResult, scheduleResult] = await Promise.all([
    view === 'calendar'
      ? supabase.from('content_plans').select('*, creator:profiles!created_by(full_name, username, avatar_url)').eq('client_id', clientId).gte('date', startDate).lte('date', endDate).order('date')
      : Promise.resolve({ data: [] }),
    view === 'task'
      ? (async () => {
          const { data: coAssigned } = await supabase.from('task_assignments').select('task_id').eq('user_id', user.id)
          const coIds = (coAssigned ?? []).map((r: { task_id: string }) => r.task_id)
          return supabase.from('tasks')
            .select('*, project:projects(id, name, color, avatar_url)')
            .or(`assigned_to.eq.${user.id}${coIds.length > 0 ? `,id.in.(${coIds.join(',')})` : ''}`)
            .order('due_date', { ascending: true, nullsFirst: false })
        })()
      : Promise.resolve({ data: [] }),
    supabase.from('content_plans').select('content_type').eq('client_id', clientId).gte('date', startDate).lte('date', endDate),
    view === 'calendar'
      ? supabase.from('content_schedule').select('*').eq('client_id', clientId).gte('date', startDate).lte('date', endDate).order('date')
      : Promise.resolve({ data: [] }),
  ])

  const entries = (calendarResult.data ?? []) as ContentPlan[]
  const userTasks = (tasksResult.data ?? []) as TaskWithProject[]
  const scheduleEntries = (scheduleResult.data ?? []) as ScheduleEntry[]
  const stats = statsResult.data ?? []
  const postCount  = stats.filter(e => e.content_type === 'post').length
  const reelCount  = stats.filter(e => e.content_type === 'reel').length
  const storyCount = stats.filter(e => e.content_type === 'story').length

  // Generate signed URL for PDF download
  let pdfSignedUrl: string | null = null
  if (client.content_plan_pdf_path) {
    const serviceClient = createSupabaseServiceClient()
    const { data } = await serviceClient.storage
      .from('task-attachments')
      .createSignedUrl(client.content_plan_pdf_path, 3600)
    pdfSignedUrl = data?.signedUrl ?? null
  }

  const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link href="/freelancer/content-planner" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 w-fit transition-colors">
        <ChevronLeft className="w-3 h-3" /> Content Planner
      </Link>

      <ClientPlannerHeader
        client={client}
        clientId={clientId}
        basePath={basePath}
        view={view}
        month={month}
        year={year}
        monthName={monthName}
        postCount={postCount}
        reelCount={reelCount}
        storyCount={storyCount}
        pdfSignedUrl={pdfSignedUrl}
        canEditPdf={false}
        canShare={true}
        secondaryView={{ id: 'task', label: 'Task', icon: CheckSquare }}
        shareLinks={(shareLinks ?? []) as ContentShareLink[]}
      />

      {/* Content */}
      {view === 'calendar' ? (
        <ContentPlannerCalendar
          key={`${year}-${month}`}
          entries={entries}
          scheduleEntries={scheduleEntries}
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
