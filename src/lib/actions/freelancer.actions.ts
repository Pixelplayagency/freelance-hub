'use server'

import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { FreelancerRole } from '@/lib/types/app.types'

export async function assignJobRole(id: string, job_role: FreelancerRole | null) {
  const supabase = createSupabaseServiceClient()
  const { error } = await supabase
    .from('profiles')
    .update({ job_role })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/workspace')
}

export async function approveFreelancer(id: string) {
  const supabase = createSupabaseServiceClient()
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'active' })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/freelancers')
}

export async function removeFreelancer(id: string) {
  const supabase = createSupabaseServiceClient()
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'removed' })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/freelancers')
}
