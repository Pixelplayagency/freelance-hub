import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClientListPage } from '@/components/content-planner/ClientListPage'
import type { ContentClient } from '@/lib/types/app.types'

export default async function AdminContentPlannerPage() {
  const supabase = await createSupabaseServerClient()
  // Session already validated in (dashboard)/layout.tsx — read it from the cookie (no network call).
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'manager') redirect('/freelancer')

  const { data: clients } = await supabase
    .from('content_clients')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <ClientListPage
      clients={(clients ?? []) as ContentClient[]}
      isAdmin={true}
    />
  )
}
