import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import { TaskReferences } from '@/components/tasks/TaskReferences'
import { EditTaskButton } from '@/components/tasks/EditTaskButton'
import { DeleteTaskButton } from '@/components/tasks/DeleteTaskButton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChevronLeft, Calendar, Clock, User } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO, isPast, isToday, isTomorrow } from 'date-fns'
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

  const assignee = task.assignee as Profile | null

  // Parse deadline into date + time parts
  const deadlineParsed = task.due_date ? parseISO(task.due_date) : null
  const deadlineDate = deadlineParsed ? format(deadlineParsed, 'EEE, MMM d yyyy') : null
  const deadlineTime = deadlineParsed
    ? (deadlineParsed.getHours() !== 0 || deadlineParsed.getMinutes() !== 0
        ? format(deadlineParsed, 'h:mm a')
        : null)
    : null
  const deadlineStatus = deadlineParsed
    ? isToday(deadlineParsed) ? 'today'
      : isTomorrow(deadlineParsed) ? 'tomorrow'
      : isPast(deadlineParsed) ? 'overdue'
      : 'upcoming'
    : null

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
        <div className="flex flex-wrap gap-3">
          {/* Assignee */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm">
            <User className="w-3.5 h-3.5 text-gray-400" />
            {assignee ? (
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px]" style={{ backgroundColor: '#fff3f3', color: '#f24a49' }}>
                    {assignee.full_name?.[0]?.toUpperCase() ?? assignee.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-gray-700 font-medium">{assignee.full_name ?? assignee.email}</span>
              </div>
            ) : (
              <span className="text-gray-400">Unassigned</span>
            )}
          </div>

          {/* Deadline */}
          {deadlineParsed ? (
            <div className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg border text-sm',
              deadlineStatus === 'overdue' ? 'bg-red-50 border-red-100' :
              deadlineStatus === 'today' ? 'bg-amber-50 border-amber-100' :
              deadlineStatus === 'tomorrow' ? 'bg-amber-50/50 border-amber-100/60' :
              'bg-gray-50 border-gray-100'
            )}>
              <div className="flex items-center gap-1.5">
                <Calendar className={cn('w-3.5 h-3.5',
                  deadlineStatus === 'overdue' ? 'text-red-500' :
                  deadlineStatus === 'today' || deadlineStatus === 'tomorrow' ? 'text-amber-500' :
                  'text-gray-400'
                )} />
                <span className={cn('font-medium',
                  deadlineStatus === 'overdue' ? 'text-red-600' :
                  deadlineStatus === 'today' || deadlineStatus === 'tomorrow' ? 'text-amber-600' :
                  'text-gray-700'
                )}>
                  {deadlineStatus === 'overdue' && 'Overdue · '}
                  {deadlineStatus === 'today' && 'Due today · '}
                  {deadlineStatus === 'tomorrow' && 'Due tomorrow · '}
                  {deadlineDate}
                </span>
              </div>
              {deadlineTime && (
                <div className="flex items-center gap-1 pl-2 border-l border-current/20">
                  <Clock className={cn('w-3.5 h-3.5',
                    deadlineStatus === 'overdue' ? 'text-red-400' :
                    deadlineStatus === 'today' || deadlineStatus === 'tomorrow' ? 'text-amber-400' :
                    'text-gray-400'
                  )} />
                  <span className={cn('font-semibold',
                    deadlineStatus === 'overdue' ? 'text-red-600' :
                    deadlineStatus === 'today' || deadlineStatus === 'tomorrow' ? 'text-amber-600' :
                    'text-gray-700'
                  )}>{deadlineTime}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              No deadline set
            </div>
          )}
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
