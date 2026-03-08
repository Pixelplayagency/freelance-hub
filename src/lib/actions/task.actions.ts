'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { taskSchema } from '@/lib/validations/task.schema'
import { revalidatePath } from 'next/cache'
import type { TaskStatus } from '@/lib/types/app.types'

export async function createTask(formData: unknown) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const validated = taskSchema.parse(formData)

  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...validated, created_by: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/projects/${validated.project_id}`)
  return data
}

export async function updateTask(taskId: string, updates: Partial<{
  title: string
  description: string
  assigned_to: string | null
  due_date: string | null
}>) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select('project_id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/projects/${data.project_id}`)
  return data
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  sort_order: number
) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('tasks')
    .update({ status, sort_order })
    .eq('id', taskId)

  if (error) throw new Error(error.message)
  // No revalidatePath — Realtime handles live updates
}

export async function setTaskStatus(taskId: string, status: TaskStatus) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)
    .select('project_id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/projects/${data.project_id}`)
  revalidatePath(`/freelancer/tasks/${taskId}`)
}

export async function deleteTask(taskId: string, projectId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/projects/${projectId}`)
}
