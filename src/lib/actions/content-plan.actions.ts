'use server'

import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ContentType, ContentPlanStatus, MediaItem } from '@/lib/types/app.types'

// ── Clients ────────────────────────────────────────────────────────────────

export async function createContentClient(name: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('content_clients').insert({ name: name.trim(), created_by: user.id })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content-planner')
  revalidatePath('/freelancer/content-planner')
}

export async function updateContentClient(id: string, data: {
  name?: string
  description?: string | null
  color?: string
  cover_image_url?: string | null
  avatar_url?: string | null
  instagram_url?: string | null
  facebook_url?: string | null
  tiktok_url?: string | null
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('content_clients').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content-planner')
  revalidatePath('/freelancer/content-planner')
}

export async function deleteContentClient(id: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('content_clients').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content-planner')
  revalidatePath('/freelancer/content-planner')
}

export async function uploadClientPdf(base64: string, clientId: string): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64
  const buffer = Buffer.from(base64Data, 'base64')

  const path = `clients/${clientId}/content-plan.pdf`
  const serviceClient = createSupabaseServiceClient()
  const { error: storageError } = await serviceClient.storage
    .from('task-attachments')
    .upload(path, buffer, { contentType: 'application/pdf', upsert: true })
  if (storageError) throw new Error(storageError.message)

  const { error } = await supabase.from('content_clients').update({ content_plan_pdf_path: path }).eq('id', clientId)
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/content-planner/${clientId}`)
  revalidatePath(`/freelancer/content-planner/${clientId}`)
}

export async function deleteClientPdf(clientId: string): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const path = `clients/${clientId}/content-plan.pdf`
  const serviceClient = createSupabaseServiceClient()
  await serviceClient.storage.from('task-attachments').remove([path])

  const { error } = await supabase.from('content_clients').update({ content_plan_pdf_path: null }).eq('id', clientId)
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/content-planner/${clientId}`)
  revalidatePath(`/freelancer/content-planner/${clientId}`)
}

export async function saveClientLink(clientId: string, url: string): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  try { new URL(url) } catch { throw new Error('Invalid URL') }

  const { error } = await supabase.from('content_clients').update({ content_plan_link: url }).eq('id', clientId)
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/content-planner/${clientId}`)
  revalidatePath(`/freelancer/content-planner/${clientId}`)
}

export async function deleteClientLink(clientId: string): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('content_clients').update({ content_plan_link: null }).eq('id', clientId)
  if (error) throw new Error(error.message)

  revalidatePath(`/admin/content-planner/${clientId}`)
  revalidatePath(`/freelancer/content-planner/${clientId}`)
}

// ── Plans ──────────────────────────────────────────────────────────────────

interface ContentPlanInput {
  client_id: string
  date: string
  content_type: ContentType
  platforms?: string[]
  scheduled_time?: string | null
  caption?: string | null
  media_url?: string | null
  media_type?: 'image' | 'video' | null
  media_items?: MediaItem[]
  status?: ContentPlanStatus
  client_comments?: string | null
}

export async function createContentPlan(data: ContentPlanInput) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: created, error } = await supabase.from('content_plans').insert({ ...data, platform: 'ig_fb', created_by: user.id }).select().single()
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content-planner')
  revalidatePath(`/admin/content-planner/${data.client_id}`)
  revalidatePath('/freelancer/content-planner')
  revalidatePath(`/freelancer/content-planner/${data.client_id}`)
  return created
}

export async function updateContentPlan(id: string, data: Partial<Omit<ContentPlanInput, 'client_id' | 'date'>>) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('content_plans').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content-planner', 'layout')
  revalidatePath('/freelancer/content-planner', 'layout')
}

export async function deleteContentPlan(id: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('content_plans').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content-planner', 'layout')
  revalidatePath('/freelancer/content-planner', 'layout')
}

export async function approveCaption(id: string, approved: boolean) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('content_plans').update({ caption_approved: approved, caption_rejected: false }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content-planner', 'layout')
  revalidatePath('/freelancer/content-planner', 'layout')
}

export async function approvePost(id: string, approved: boolean) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('content_plans').update({ post_approved: approved, post_rejected: false }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content-planner', 'layout')
  revalidatePath('/freelancer/content-planner', 'layout')
}

export async function rejectCaption(id: string, rejected: boolean) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('content_plans').update({ caption_rejected: rejected, caption_approved: false }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content-planner', 'layout')
  revalidatePath('/freelancer/content-planner', 'layout')
}

export async function rejectPost(id: string, rejected: boolean) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('content_plans').update({ post_rejected: rejected, post_approved: false }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content-planner', 'layout')
  revalidatePath('/freelancer/content-planner', 'layout')
}

export async function submitForApproval(id: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('content_plans').update({ approval_requested: true }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content-planner', 'layout')
  revalidatePath('/freelancer/content-planner', 'layout')
}
