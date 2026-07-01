'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ContentPlanStatus, ScheduleContentType } from '@/lib/types/app.types'

export async function createScheduleEntry(data: { client_id: string; date: string; content_type: ScheduleContentType }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: created, error } = await supabase
    .from('content_schedule')
    .insert({ ...data, created_by: user.id })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content-planner', 'layout')
  revalidatePath('/freelancer/content-planner', 'layout')
  return created
}

export async function updateScheduleEntry(id: string, data: Partial<{
  content_type: ScheduleContentType
  platforms: string[]
  scheduled_time: string | null
  status: ContentPlanStatus
  note: string | null
}>) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('content_schedule').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content-planner', 'layout')
  revalidatePath('/freelancer/content-planner', 'layout')
}

export async function deleteScheduleEntry(id: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { error } = await supabase.from('content_schedule').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/content-planner', 'layout')
  revalidatePath('/freelancer/content-planner', 'layout')
}
