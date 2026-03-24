import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ContentPlannerCalendar } from '@/components/content-planner/ContentPlannerCalendar'
import { ContentPlannerTaskView } from '@/components/content-planner/ContentPlannerTaskView'
import { ClientPdfSection } from '@/components/content-planner/ClientPdfSection'
import Link from 'next/link'
import { ChevronLeft, CalendarDays, CheckSquare, Instagram, Facebook } from 'lucide-react'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import type { ContentPlan, Task, Project } from '@/lib/types/app.types'

type TaskWithProject = Task & {
  project: Pick<Project, 'id' | 'name' | 'color' | 'avatar_url'> | null
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.2 8.2 0 004.79 1.53V6.82a4.85 4.85 0 01-1.02-.13z" />
    </svg>
  )
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
  const startDate = new Date(year, month, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

  // Fetch calendar entries, task view data, and monthly stats in parallel
  const [calendarResult, tasksResult, statsResult] = await Promise.all([
    view === 'calendar'
      ? supabase.from('content_plans').select('*').eq('client_id', clientId).gte('date', startDate).lte('date', endDate).order('date')
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
  ])

  const entries = (calendarResult.data ?? []) as ContentPlan[]
  const userTasks = (tasksResult.data ?? []) as TaskWithProject[]
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
  const hasSocials = client.instagram_url || client.facebook_url || client.tiktok_url

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link href="/freelancer/content-planner" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 w-fit transition-colors">
        <ChevronLeft className="w-3 h-3" /> Content Planner
      </Link>

      {/* Hero header card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Top row: avatar + name + socials + toggle */}
        <div className="flex items-center justify-between gap-4 px-4 pt-4 pb-3 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            {client.avatar_url ? (
              <img src={client.avatar_url} alt="" className="w-11 h-11 rounded-xl object-cover border border-border shrink-0" />
            ) : (
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
                style={{ background: client.color }}
              >
                {client.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-foreground leading-tight">{client.name}</h1>
                {hasSocials && (
                  <div className="flex items-center gap-1">
                    {client.instagram_url && (
                      <a href={client.instagram_url} target="_blank" rel="noopener noreferrer"
                        className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                        <Instagram className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {client.facebook_url && (
                      <a href={client.facebook_url} target="_blank" rel="noopener noreferrer"
                        className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                        <Facebook className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {client.tiktok_url && (
                      <a href={client.tiktok_url} target="_blank" rel="noopener noreferrer"
                        className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                        <TikTokIcon className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
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

        {/* Bottom row: month label + PDF + content counts */}
        <div className="border-t border-border flex items-center justify-between px-4 py-2.5 bg-muted/20 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs text-muted-foreground font-medium">
              Monthly content schedule — <span className="text-foreground font-semibold">{monthName}</span>
            </p>
            <ClientPdfSection
              clientId={clientId}
              pdfUrl={pdfSignedUrl}
              hasPdf={!!client.content_plan_pdf_path}
              hasLink={!!client.content_plan_link}
              linkUrl={client.content_plan_link}
              canEdit={true}
            />
          </div>
          <div className="flex items-center gap-px bg-background border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 text-center">
              <p className="text-base font-bold text-foreground tabular-nums">{postCount}</p>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Posts</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="px-4 py-2 text-center">
              <p className="text-base font-bold text-foreground tabular-nums">{reelCount}</p>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Reels</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="px-4 py-2 text-center">
              <p className="text-base font-bold text-foreground tabular-nums">{storyCount}</p>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Stories</p>
            </div>
          </div>
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
