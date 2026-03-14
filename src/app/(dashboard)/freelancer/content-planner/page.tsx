import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClientListPage } from '@/components/content-planner/ClientListPage'
import type { ContentClient } from '@/lib/types/app.types'

export default async function FreelancerContentPlannerPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('job_role').eq('id', user.id).single()
  if (profile?.job_role !== 'social_media_manager') redirect('/freelancer')

  const { data: clients } = await supabase
    .from('content_clients')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <ClientListPage
      clients={(clients ?? []) as ContentClient[]}
      isAdmin={false}
    />
  )
}
