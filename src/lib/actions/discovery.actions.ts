'use server'

import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { DiscoveryToken } from '@/lib/types/app.types'

export async function createDiscoveryToken({
  label,
  adminId,
  expiresAt,
}: {
  label: string | null
  adminId: string
  expiresAt: string | null
}): Promise<{ token?: DiscoveryToken; error?: string }> {
  const supabase = createSupabaseServiceClient()

  const { data, error } = await supabase
    .from('client_discovery_tokens')
    .insert({
      label: label || null,
      created_by: adminId,
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
