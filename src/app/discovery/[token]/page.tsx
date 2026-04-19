import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { DiscoveryForm } from '@/components/discovery/DiscoveryForm'
import { notFound } from 'next/navigation'

export default async function DiscoveryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createSupabaseServiceClient()

  const { data: tokenRow } = await supabase
    .from('client_discovery_tokens')
    .select('id, token, label, expires_at, used_at')
    .eq('token', token)
    .single()

  if (!tokenRow) return notFound()

  const isExpired = tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()
  const isUsed = !!tokenRow.used_at

  return (
    <DiscoveryForm
      tokenId={tokenRow.id}
      token={token}
      label={tokenRow.label}
      isExpired={!!isExpired}
      isUsed={isUsed}
    />
  )
}
