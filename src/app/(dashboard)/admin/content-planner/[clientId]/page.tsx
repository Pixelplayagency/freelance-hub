import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ContentPlannerAdminList } from '@/components/content-planner/ContentPlannerAdminList'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { ContentPlan } from '@/lib/types/app.types'

export default async function AdminClientCalendarPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/freelancer')

  const { clientId } = await params
  const { data: client } = await supabase.from('content_clients').select('*').eq('id', clientId).single()
  if (!client) notFound()

  const { data: entries } = await supabase
    .from('content_plans')
    .select('*, creator:profiles!created_by(full_name, username)')
    .eq('client_id', clientId)
    .order('date', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/content-planner" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2 w-fit transition-colors">
          <ChevronLeft className="w-3 h-3" /> Content Planner
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Review and approve content plans</p>
      </div>
      <ContentPlannerAdminList entries={(entries ?? []) as ContentPlan[]} />
    </div>
  )
}
