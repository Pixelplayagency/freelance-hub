'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
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

  const { data, error } = await supabase
    .from('task_references')
    .insert({ task_id: taskId, ...ref, created_by: user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath(`/admin/projects/${task.project_id}`)
  revalidatePath(`/admin/projects/${task.project_id}/tasks/${taskId}`)

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
    .like('title', '[Final]%')
    .order('created_at')

  if (error) throw new Error(error.message)
  if (!refs || refs.length === 0) return []

  const result: { ref: typeof refs[number]; signedUrl: string | null }[] = []
  for (const ref of refs) {
    let signedUrl: string | null = ref.url ?? null
    if (!signedUrl && ref.storage_path) {
      const { data } = await supabase.storage
        .from('task-attachments')
        .createSignedUrl(ref.storage_path, 3600)
      signedUrl = data?.signedUrl ?? null
    }
    result.push({ ref, signedUrl })
  }
  return result
}

export async function clearSubmittedFiles(taskId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Fetch all submitted file references
  const { data: refs } = await supabase
    .from('task_references')
    .select('id, storage_path')
    .eq('task_id', taskId)
    .in('type', ['image', 'video', 'link'])
    .like('title', '[Final]%')

  if (!refs || refs.length === 0) return

  // Delete from Supabase storage where applicable
  const storagePaths = refs.map(r => r.storage_path).filter(Boolean) as string[]
  if (storagePaths.length > 0) {
    await supabase.storage.from('task-attachments').remove(storagePaths)
  }

  // Delete the DB rows (only freelancer-submitted files, not admin references)
  await supabase
    .from('task_references')
    .delete()
    .eq('task_id', taskId)
    .in('type', ['image', 'video', 'link'])
    .like('title', '[Final]%')
}

export async function getStoragePublicUrl(path: string) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.storage
    .from('task-attachments')
    .createSignedUrl(path, 3600) // 1 hour expiry

  return data?.signedUrl ?? null
}

export async function uploadProjectImage(
  base64: string,
  projectId: string,
  type: 'cover' | 'avatar'
): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Decode base64 data URL to buffer
  const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
  if (!matches) throw new Error('Invalid image data')
  const buffer = Buffer.from(matches[2], 'base64')

  const path = `${projectId}/${type}.jpg`

  const { error } = await supabase.storage
    .from('project-assets')
    .upload(path, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('project-assets').getPublicUrl(path)
  // Bust cache by appending timestamp
  return `${data.publicUrl}?t=${Date.now()}`
}
