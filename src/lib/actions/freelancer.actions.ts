'use server'

import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { FreelancerRole } from '@/lib/types/app.types'

async function requireAdmin() {
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await authClient.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Forbidden')
}

export async function assignJobRole(id: string, job_role: FreelancerRole | null) {
  await requireAdmin()
  const supabase = createSupabaseServiceClient()
  const { error } = await supabase
    .from('profiles')
    .update({ job_role })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/workspace')
}

export async function approveFreelancer(id: string) {
  await requireAdmin()
  const supabase = createSupabaseServiceClient()
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'active' })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/freelancers')
}

export async function removeFreelancer(id: string) {
  await requireAdmin()
  const supabase = createSupabaseServiceClient()
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'removed' })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/freelancers')
}
