'use server'

import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
