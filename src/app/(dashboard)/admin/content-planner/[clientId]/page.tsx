import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ContentPlannerAdminList } from '@/components/content-planner/ContentPlannerAdminList'
import { ContentPlannerCalendar } from '@/components/content-planner/ContentPlannerCalendar'
import { ClientPlannerHeader } from '@/components/content-planner/ClientPlannerHeader'
import Link from 'next/link'
import { ChevronLeft, List } from 'lucide-react'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import type { ContentPlan, ScheduleEntry } from '@/lib/types/app.types'

export default async function AdminClientCalendarPage({
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

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'manager') redirect('/freelancer')

  const { clientId } = await params
  const sp = await searchParams

  const { data: client } = await supabase.from('content_clients').select('*').eq('id', clientId).single()
  if (!client) notFound()

  const view = sp.view === 'calendar' ? 'calendar' : 'list'
  const now = new Date()
  const month = sp.month !== undefined ? parseInt(sp.month) : now.getMonth()
  const year  = sp.year  !== undefined ? parseInt(sp.year)  : now.getFullYear()

  const startDate = new Date(year, month, 1).toISOString().split('T')[0]
  const endDate   = new Date(year, month + 1, 0).toISOString().split('T')[0]

  // Always fetch monthly stats for the header
  const [calendarResult, listResult, statsResult, scheduleResult] = await Promise.all([
    view === 'calendar'
      ? supabase.from('content_plans').select('*, creator:profiles!created_by(full_name, username, avatar_url)').eq('client_id', clientId).gte('date', startDate).lte('date', endDate).order('date')
      : Promise.resolve({ data: [] }),
    view === 'list'
      ? supabase.from('content_plans').select('*, creator:profiles!created_by(full_name, username)').eq('client_id', clientId).order('date', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase.from('content_plans').select('content_type').eq('client_id', clientId).gte('date', startDate).lte('date', endDate),
    view === 'calendar'
      ? supabase.from('content_schedule').select('*').eq('client_id', clientId).gte('date', startDate).lte('date', endDate).order('date')
      : Promise.resolve({ data: [] }),
  ])

  const entries = (view === 'calendar' ? calendarResult.data : listResult.data ?? []) as ContentPlan[]
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

  const basePath = `/admin/content-planner/${clientId}`
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link href="/admin/content-planner" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 w-fit transition-colors">
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
        canEditPdf={true}
        secondaryView={{ id: 'list', label: 'List', icon: List }}
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
          isAdmin={true}
        />
      ) : (
        <ContentPlannerAdminList entries={entries} />
      )}
    </div>
  )
}
