'use server'

import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { DiscoveryToken } from '@/lib/types/app.types'

async function requireAdmin() {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { user: null, error: 'Unauthorized' as const }
  const { data: profile } = await authClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { user: null, error: 'Forbidden' as const }
  return { user, error: null }
}

export async function createDiscoveryToken({
  label,
  expiresAt,
}: {
  label: string | null
  expiresAt: string | null
}): Promise<{ token?: DiscoveryToken; error?: string }> {
  const { user, error: authError } = await requireAdmin()
  if (authError || !user) return { error: authError ?? 'Unauthorized' }

  const supabase = createSupabaseServiceClient()

  const { data, error } = await supabase
    .from('client_discovery_tokens')
    .insert({
      label: label || null,
      created_by: user.id,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('createDiscoveryToken error:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/discovery')
  return { token: data as DiscoveryToken }
}

export async function deleteDiscoveryToken(id: string): Promise<{ error?: string }> {
  const { error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  const supabase = createSupabaseServiceClient()

  // Delete submission first (FK)
  await supabase.from('client_discovery_submissions').delete().eq('token_id', id)

  const { error } = await supabase.from('client_discovery_tokens').delete().eq('id', id)

  if (error) {
    console.error('deleteDiscoveryToken error:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/discovery')
  return {}
}
