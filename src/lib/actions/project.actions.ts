'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { projectSchema } from '@/lib/validations/project.schema'
import { revalidatePath } from 'next/cache'

export async function createProject(formData: unknown) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const validated = projectSchema.parse(formData)

  const { data, error } = await supabase
    .from('projects')
    .insert({ ...validated, created_by: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/admin/projects')
  return data
}

export async function updateProject(projectId: string, formData: unknown) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const validated = projectSchema.partial().parse(formData)

  const { error } = await supabase
    .from('projects')
    .update(validated)
    .eq('id', projectId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/projects')
  revalidatePath(`/admin/projects/${projectId}`)
}

export async function deleteProject(projectId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/projects')
}

export async function archiveProject(projectId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('projects')
    .update({ status: 'archived' })
    .eq('id', projectId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/projects')
}
