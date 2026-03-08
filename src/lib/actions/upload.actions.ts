'use server'

import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ReferenceType } from '@/lib/types/app.types'

export async function getSignedUploadUrl(taskId: string, filename: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify access
  const { data: task } = await supabase
    .from('tasks')
    .select('id')
    .eq('id', taskId)
    .single()
  if (!task) throw new Error('Task not found or access denied')

  const ext = filename.split('.').pop()
  const path = `${taskId}/${crypto.randomUUID()}.${ext}`

  const { data, error } = await supabase.storage
    .from('task-attachments')
    .createSignedUploadUrl(path)

  if (error) throw new Error(error.message)

  return { signedUrl: data.signedUrl, path }
}

export async function saveTaskReference(
  taskId: string,
  ref: {
    type: ReferenceType
    storage_path?: string
    url?: string
    content?: string
    title?: string
  }
) {
  // Auth check via user session (respects RLS for the task lookup)
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify the user can access this task (RLS-enforced: admin sees all, freelancer sees assigned)
  const { data: task } = await supabase
    .from('tasks')
    .select('id, project_id')
    .eq('id', taskId)
    .single()
  if (!task) throw new Error('Task not found or access denied')

  // Use service client for the INSERT so the RLS "notes-only" policy doesn't block
  // image / video / link submissions from freelancers
  const serviceClient = await createSupabaseServiceClient()
  const { data, error } = await serviceClient
    .from('task_references')
    .insert({ task_id: taskId, ...ref, created_by: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/projects/${task.project_id}`)
  revalidatePath(`/admin/projects/${task.project_id}/tasks/${taskId}`)
  revalidatePath(`/freelancer/tasks/${taskId}`)

  return data
}

export async function deleteTaskReference(referenceId: string, taskId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get storage path before deleting
  const { data: ref } = await supabase
    .from('task_references')
    .select('storage_path')
    .eq('id', referenceId)
    .single()

  const { error } = await supabase
    .from('task_references')
    .delete()
    .eq('id', referenceId)

  if (error) throw new Error(error.message)

  // Delete from storage if it was an image
  if (ref?.storage_path) {
    await supabase.storage
      .from('task-attachments')
      .remove([ref.storage_path])
  }

  const { data: task } = await supabase
    .from('tasks')
    .select('project_id')
    .eq('id', taskId)
    .single()

  if (task) revalidatePath(`/admin/projects/${task.project_id}`)
}

export async function getTaskSubmittedFiles(taskId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: refs, error } = await supabase
    .from('task_references')
    .select('*')
    .eq('task_id', taskId)
    .in('type', ['image', 'video', 'link'])
    .order('created_at')

  if (error) throw new Error(error.message)
  if (!refs || refs.length === 0) return []

  const result: { ref: typeof refs[number]; signedUrl: string | null }[] = []
  for (const ref of refs) {
    let signedUrl: string | null = null
    if (ref.storage_path) {
      const { data } = await supabase.storage
        .from('task-attachments')
        .createSignedUrl(ref.storage_path, 3600)
      signedUrl = data?.signedUrl ?? null
    }
    result.push({ ref, signedUrl })
  }
  return result
}

export async function getStoragePublicUrl(path: string) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.storage
    .from('task-attachments')
    .createSignedUrl(path, 3600) // 1 hour expiry

  return data?.signedUrl ?? null
}
