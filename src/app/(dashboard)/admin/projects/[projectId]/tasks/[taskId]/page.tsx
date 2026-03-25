import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import { TaskReferences } from '@/components/tasks/TaskReferences'
import { EditTaskButton } from '@/components/tasks/EditTaskButton'
import { DeleteTaskButton } from '@/components/tasks/DeleteTaskButton'
import { AdminReviewActions } from '@/components/tasks/AdminReviewActions'
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
      .not('title', 'like', '[Final]%')
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
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/admin/projects" className="hover:text-foreground">Projects</Link>
        <span>/</span>
        <Link href={`/admin/projects/${projectId}`} className="hover:text-foreground">Board</Link>
        <span>/</span>
        <span className="text-foreground truncate">{task.title}</span>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <TaskStatusBadge status={task.status} />
            </div>
            <h1 className="text-xl font-semibold text-foreground">{task.title}</h1>
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
          <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-3">
          {/* Assignee */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border text-sm">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            {assignee ? (
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px] accent-tint" style={{ color: 'var(--primary)' }}>
                    {assignee.full_name?.[0]?.toUpperCase() ?? assignee.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-foreground font-medium">{assignee.full_name ?? assignee.email}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Unassigned</span>
            )}
          </div>

          {/* Deadline */}
          {deadlineParsed ? (
            <div className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg border text-sm',
              deadlineStatus === 'overdue' ? 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-900/40' :
              deadlineStatus === 'today' ? 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/40' :
              deadlineStatus === 'tomorrow' ? 'bg-amber-50/50 border-amber-100/60 dark:bg-amber-900/10 dark:border-amber-900/30' :
              'bg-muted border-border'
            )}>
              <div className="flex items-center gap-1.5">
                <Calendar className={cn('w-3.5 h-3.5',
                  deadlineStatus === 'overdue' ? 'text-red-500 dark:text-red-400' :
                  deadlineStatus === 'today' || deadlineStatus === 'tomorrow' ? 'text-amber-500 dark:text-amber-400' :
                  'text-muted-foreground'
                )} />
                <span className={cn('font-medium',
                  deadlineStatus === 'overdue' ? 'text-red-600 dark:text-red-400' :
                  deadlineStatus === 'today' || deadlineStatus === 'tomorrow' ? 'text-amber-600 dark:text-amber-400' :
                  'text-foreground'
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
                    'text-muted-foreground'
                  )} />
                  <span className={cn('font-semibold',
                    deadlineStatus === 'overdue' ? 'text-red-600 dark:text-red-400' :
                    deadlineStatus === 'today' || deadlineStatus === 'tomorrow' ? 'text-amber-600 dark:text-amber-400' :
                    'text-foreground'
                  )}>{deadlineTime}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              No deadline set
            </div>
          )}
        </div>

        {/* Review actions — only shown when freelancer has submitted */}
        {task.status === 'review' && (
          <AdminReviewActions
            taskId={taskId}
            assigneeName={assignee?.full_name ?? assignee?.email ?? null}
          />
        )}

        {/* Separator */}
        <hr className="border-border" />

        {/* References */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">References & Chat</h2>
          <TaskReferences
            taskId={taskId}
            references={(references ?? []) as TaskReference[]}
            isAdmin={true}
            canEdit={true}
            currentUserId={user.id}
            otherPartyName={assignee?.full_name ?? assignee?.email ?? null}
          />
        </div>
      </div>
    </div>
  )
}
