import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DiscoveryAdminPage } from '@/components/discovery/DiscoveryAdminPage'
import type { DiscoveryToken, DiscoveryConfig } from '@/lib/types/app.types'
import { DEFAULT_DISCOVERY_CONFIG } from '@/lib/types/app.types'

export default async function AdminDiscoveryPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/freelancer')

  const serviceClient = createSupabaseServiceClient()

  const [{ data: tokens }, { data: configRow }] = await Promise.all([
    serviceClient
      .from('client_discovery_tokens')
      .select('*, submission:client_discovery_submissions(*)')
      .order('created_at', { ascending: false }),
    serviceClient
      .from('discovery_config')
      .select('config')
      .eq('id', 1)
      .single(),
  ])

  const config: DiscoveryConfig = (configRow?.config as DiscoveryConfig) ?? DEFAULT_DISCOVERY_CONFIG

  return (
    <DiscoveryAdminPage
      tokens={(tokens ?? []) as DiscoveryToken[]}
      adminId={user.id}
      initialConfig={config}
    />
  )
}
