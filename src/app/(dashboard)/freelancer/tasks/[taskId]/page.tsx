import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TaskReferences } from '@/components/tasks/TaskReferences'
import { FreelancerStatusUpdate } from '@/components/tasks/FreelancerStatusUpdate'
import { DeadlineProgress } from '@/components/tasks/DeadlineProgress'
import { SubmitWorkSection } from '@/components/tasks/SubmitWorkSection'
import { Calendar, ChevronLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO, isPast, isToday, isTomorrow } from 'date-fns'
import { cn } from '@/lib/utils/cn'
import type { TaskReference, TaskStatus } from '@/lib/types/app.types'

export default async function FreelancerTaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: task }, { data: references }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, project:projects(id, name, color)')
      .eq('id', taskId)
      .eq('assigned_to', user.id) // RLS + explicit filter
      .single(),
    supabase
      .from('task_references')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at'),
  ])

  if (!task) notFound()

  const project = task.project as { id: string; name: string; color: string } | null

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
        <Link href="/freelancer/tasks" className="hover:text-gray-900 flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" />
          My Tasks
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {project && (
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                <span className="text-xs text-gray-500 font-medium">{project.name}</span>
              </div>
            )}
            <h1 className="text-xl font-semibold text-gray-900">{task.title}</h1>
          </div>
          {/* Freelancer can update status */}
          <FreelancerStatusUpdate
            taskId={taskId}
            currentStatus={task.status as TaskStatus}
          />
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-gray-600 leading-relaxed">{task.description}</p>
        )}

        {/* Deadline */}
        {deadlineParsed ? (
          <div className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm w-fit',
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
        ) : null}

        {/* Timeline progress bar */}
        {task.due_date && task.created_at && (
          <DeadlineProgress createdAt={task.created_at} dueDate={task.due_date} />
        )}

        {/* Submit work */}
        <SubmitWorkSection taskId={taskId} status={task.status as TaskStatus} />

        <hr className="border-gray-100" />

        {/* References */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">References & Notes</h2>
          <TaskReferences
            taskId={taskId}
            references={(references ?? []) as TaskReference[]}
            isAdmin={false}
            canEdit={true}
          />
        </div>
      </div>
    </div>
  )
}
