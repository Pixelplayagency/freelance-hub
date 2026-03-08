import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import { TaskReferences } from '@/components/tasks/TaskReferences'
import { EditTaskButton } from '@/components/tasks/EditTaskButton'
import { DeleteTaskButton } from '@/components/tasks/DeleteTaskButton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChevronLeft, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { formatDate, dueDateLabel } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import type { Task, TaskReference, Profile } from '@/lib/types/app.types'

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; taskId: string }>
}) {
  const { projectId, taskId } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: task }, { data: references }, { data: freelancers }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, assignee:profiles!assigned_to(id, full_name, email, avatar_url)')
      .eq('id', taskId)
      .single(),
    supabase
      .from('task_references')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at'),
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'freelancer'),
  ])

  if (!task) notFound()

  const dateInfo = dueDateLabel(task.due_date)
  const assignee = task.assignee as Profile | null

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/projects" className="hover:text-gray-900">Projects</Link>
        <span>/</span>
        <Link href={`/admin/projects/${projectId}`} className="hover:text-gray-900">Board</Link>
        <span>/</span>
        <span className="text-gray-900 truncate">{task.title}</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <TaskStatusBadge status={task.status} />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">{task.title}</h1>
          </div>
          <div className="flex items-center gap-1">
            <EditTaskButton
              task={task as Task}
              freelancers={(freelancers ?? []) as Pick<Profile, 'id' | 'full_name' | 'email'>[]}
              projectId={projectId}
            />
            <DeleteTaskButton taskId={taskId} projectId={projectId} />
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-gray-600 leading-relaxed">{task.description}</p>
        )}

        {/* Meta */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            {assignee ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px]" style={{ backgroundColor: '#fff3f3', color: '#f24a49' }}>
                    {assignee.full_name?.[0]?.toUpperCase() ?? assignee.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-gray-700">{assignee.full_name ?? assignee.email}</span>
              </div>
            ) : (
              <span className="text-gray-400">Unassigned</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className={cn(dateInfo.className)}>
              {task.due_date ? dateInfo.label : 'No due date'}
            </span>
          </div>
        </div>

        {/* Separator */}
        <hr className="border-gray-100" />

        {/* References */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">References & Notes</h2>
          <TaskReferences
            taskId={taskId}
            references={(references ?? []) as TaskReference[]}
            isAdmin={true}
            canEdit={true}
          />
        </div>
      </div>
    </div>
  )
}
