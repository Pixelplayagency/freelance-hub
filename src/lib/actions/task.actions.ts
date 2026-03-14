'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { taskSchema } from '@/lib/validations/task.schema'
import { revalidatePath } from 'next/cache'
import type { TaskStatus } from '@/lib/types/app.types'

export async function createTask(formData: unknown) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { assignee_ids, ...rest } = formData as Record<string, unknown> & { assignee_ids?: string[] }
  const validated = taskSchema.parse(rest)

  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...validated, created_by: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Insert all assignees into task_assignments
  const ids = assignee_ids && assignee_ids.length > 0 ? assignee_ids : (validated.assigned_to ? [validated.assigned_to] : [])
  if (ids.length > 0) {
    await supabase.from('task_assignments').insert(
      ids.map(uid => ({ task_id: data.id, user_id: uid, assigned_by: user.id }))
    )
  }

  revalidatePath(`/admin/projects/${validated.project_id}`)
  return data
}

export async function updateTask(taskId: string, updates: Partial<{
  title: string
  description: string
  assigned_to: string | null
  due_date: string | null
  assignee_ids: string[]
}>) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { assignee_ids, ...taskUpdates } = updates

  const { data, error } = await supabase
    .from('tasks')
    .update(taskUpdates)
    .eq('id', taskId)
    .select('project_id')
    .single()

  if (error) throw new Error(error.message)

  // Sync task_assignments
  if (assignee_ids !== undefined) {
    await supabase.from('task_assignments').delete().eq('task_id', taskId)
    if (assignee_ids.length > 0) {
      await supabase.from('task_assignments').insert(
        assignee_ids.map(uid => ({ task_id: taskId, user_id: uid, assigned_by: user.id }))
      )
    }
  }

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

  // Separate update from select — prevents RLS SELECT policy from blocking the operation
  const { error: updateError } = await supabase
    .from('tasks')
    .update({ status })
    .eq('id', taskId)

  if (updateError) throw new Error(updateError.message)

  // Fetch project_id separately (graceful if RLS restricts the read)
  const { data: taskData } = await supabase
    .from('tasks')
    .select('project_id')
    .eq('id', taskId)
    .single()

  if (taskData?.project_id) {
    revalidatePath(`/admin/projects/${taskData.project_id}`)
    revalidatePath(`/admin/projects/${taskData.project_id}/tasks/${taskId}`)
  }
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
