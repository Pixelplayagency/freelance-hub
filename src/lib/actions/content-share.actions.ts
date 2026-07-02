'use server'

import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import type { ContentShareLink, ContentShareNote } from '@/lib/types/app.types'

function unlockCookieName(token: string) {
  return `cs_unlock_${token}`
}

// ── Admin: manage links ─────────────────────────────────────────────────────

export async function createShareLink(clientId: string, password: string | null): Promise<ContentShareLink> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('content_share_links')
    .insert({ client_id: clientId, password: password?.trim() || null, created_by: user.id })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/content-planner/${clientId}`)
  return data as ContentShareLink
}

export async function revokeShareLink(id: string, clientId: string): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('content_share_links').update({ revoked_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/content-planner/${clientId}`)
}

// ── Public: unlock + notes (no session — service client bypasses RLS) ──────

export async function unlockShareLink(token: string, password: string): Promise<{ ok: boolean }> {
  const supabase = createSupabaseServiceClient()
  const { data } = await supabase
    .from('content_share_links')
    .select('password, revoked_at')
    .eq('token', token)
    .single()

  if (!data || data.revoked_at || data.password !== password) return { ok: false }

  const jar = await cookies()
  jar.set(unlockCookieName(token), '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
    path: `/share/${token}`,
  })
  return { ok: true }
}

export async function isShareLinkUnlocked(token: string): Promise<boolean> {
  const jar = await cookies()
  return jar.get(unlockCookieName(token))?.value === '1'
}

export async function submitShareNote(shareLinkId: string, authorName: string, message: string): Promise<void> {
  const trimmed = message.trim()
  if (!trimmed) throw new Error('Note cannot be empty')

  const supabase = createSupabaseServiceClient()
  const { error } = await supabase.from('content_share_notes').insert({
    share_link_id: shareLinkId,
    author_name: authorName.trim() || null,
    message: trimmed,
  })
  if (error) throw new Error(error.message)
}

export async function getShareNotesForClient(clientId: string): Promise<ContentShareNote[]> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: links } = await supabase.from('content_share_links').select('id').eq('client_id', clientId)
  const linkIds = (links ?? []).map(l => l.id)
  if (linkIds.length === 0) return []

  const { data: notes } = await supabase
    .from('content_share_notes')
    .select('*')
    .in('share_link_id', linkIds)
    .order('created_at', { ascending: false })

  return (notes ?? []) as ContentShareNote[]
}
