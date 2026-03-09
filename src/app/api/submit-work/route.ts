import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { taskId, uploads, link } = body as {
      taskId: string
      uploads: { type: 'image' | 'video'; path: string; name: string }[]
      link?: string | null
    }

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify task access (RLS enforced — freelancer sees assigned tasks, admin sees all)
    const { data: task } = await supabase
      .from('tasks')
      .select('id, project_id')
      .eq('id', taskId)
      .single()

    if (!task) {
      return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 })
    }

    // Use service client for inserts to bypass the restrictive RLS type policy
    const serviceClient = await createSupabaseServiceClient()

    // Insert task_reference row for each uploaded file
    for (const upload of uploads ?? []) {
      const { error } = await serviceClient.from('task_references').insert({
        task_id: taskId,
        type: upload.type,
        storage_path: upload.path,
        title: `[Final] ${upload.name}`,
        created_by: user.id,
      })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // Insert link reference if provided
    if (link?.trim()) {
      const { error } = await serviceClient.from('task_references').insert({
        task_id: taskId,
        type: 'link',
        url: link.trim(),
        title: '[Final] Delivery link',
        created_by: user.id,
      })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // Update task status to review
    const { error: statusError } = await supabase
      .from('tasks')
      .update({ status: 'review' })
      .eq('id', taskId)

    if (statusError) {
      return NextResponse.json({ error: statusError.message }, { status: 500 })
    }

    // Revalidate admin pages so they show fresh data
    revalidatePath(`/admin/projects/${task.project_id}`)
    revalidatePath(`/admin/projects/${task.project_id}/tasks/${taskId}`)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Submission failed' },
      { status: 500 }
    )
  }
}
