import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ContentPlannerAdminList } from '@/components/content-planner/ContentPlannerAdminList'
import { ContentPlannerCalendar } from '@/components/content-planner/ContentPlannerCalendar'
import Link from 'next/link'
import { ChevronLeft, CalendarDays, List } from 'lucide-react'
import type { ContentPlan } from '@/lib/types/app.types'

export default async function AdminClientCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>
  searchParams: Promise<{ view?: string; month?: string; year?: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/freelancer')

  const { clientId } = await params
  const sp = await searchParams

  const { data: client } = await supabase.from('content_clients').select('*').eq('id', clientId).single()
  if (!client) notFound()

  const view = sp.view === 'calendar' ? 'calendar' : 'list'
  const now = new Date()
  const month = sp.month !== undefined ? parseInt(sp.month) : now.getMonth()
  const year  = sp.year  !== undefined ? parseInt(sp.year)  : now.getFullYear()

  let entries: ContentPlan[] = []

  if (view === 'calendar') {
    const startDate = new Date(year, month, 1).toISOString().split('T')[0]
    const endDate   = new Date(year, month + 1, 0).toISOString().split('T')[0]
    const { data } = await supabase
      .from('content_plans')
      .select('*')
      .eq('client_id', clientId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date')
    entries = (data ?? []) as ContentPlan[]
  } else {
    const { data } = await supabase
      .from('content_plans')
      .select('*, creator:profiles!created_by(full_name, username)')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
    entries = (data ?? []) as ContentPlan[]
  }

  const basePath = `/admin/content-planner/${clientId}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/admin/content-planner" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2 w-fit transition-colors">
            <ChevronLeft className="w-3 h-3" /> Content Planner
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {view === 'calendar' ? 'Visual calendar overview' : 'Review and approve content plans'}
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
            href={`${basePath}?view=list`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              view === 'list'
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            List
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
          isAdmin={true}
        />
      ) : (
        <ContentPlannerAdminList entries={entries} />
      )}
    </div>
  )
}
