import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DiscoveryAdminPage } from '@/components/discovery/DiscoveryAdminPage'
import type { DiscoveryToken } from '@/lib/types/app.types'

export default async function AdminDiscoveryPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/freelancer')

  const serviceClient = createSupabaseServiceClient()

  const { data: tokens } = await serviceClient
    .from('client_discovery_tokens')
    .select(`
      *,
      submission:client_discovery_submissions(*)
    `)
    .order('created_at', { ascending: false })

  return (
    <DiscoveryAdminPage
      tokens={(tokens ?? []) as DiscoveryToken[]}
      adminId={user.id}
    />
  )
}
