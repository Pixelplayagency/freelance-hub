import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ContentPlannerCalendar } from '@/components/content-planner/ContentPlannerCalendar'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { ContentPlan } from '@/lib/types/app.types'

export default async function FreelancerClientCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>
  searchParams: Promise<{ month?: string; year?: string }>
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
  const now = new Date()
  const month = sp.month !== undefined ? parseInt(sp.month) : now.getMonth()
  const year = sp.year !== undefined ? parseInt(sp.year) : now.getFullYear()

  const startDate = new Date(year, month, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

  const { data: entries } = await supabase
    .from('content_plans')
    .select('*')
    .eq('client_id', clientId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')

  return (
    <div className="space-y-6">
      <div>
        <Link href="/freelancer/content-planner" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2 w-fit transition-colors">
          <ChevronLeft className="w-3 h-3" /> Content Planner
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Monthly content schedule</p>
      </div>
      <ContentPlannerCalendar
        entries={(entries ?? []) as ContentPlan[]}
        month={month}
        year={year}
        clientId={clientId}
        basePath={`/freelancer/content-planner/${clientId}`}
        isAdmin={false}
      />
    </div>
  )
}
