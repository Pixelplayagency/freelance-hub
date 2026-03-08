import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge'
import Link from 'next/link'
import { formatDateTime, isOverdue, isDueSoon } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { TASK_STATUSES } from '@/lib/types/app.types'

export default async function FreelancerTasksPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, project:projects(id, name, color)')
    .eq('assigned_to', user.id)
    .order('due_date', { ascending: true, nullsFirst: false })

  const allTasks = tasks ?? []

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">My Tasks</h1>

      {TASK_STATUSES.map(status => {
        const statusTasks = allTasks.filter(t => t.status === status.id)
        if (statusTasks.length === 0) return null
        return (
          <div key={status.id} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('w-2 h-2 rounded-full', {
                'bg-slate-400': status.id === 'todo',
                'bg-blue-500': status.id === 'in_progress',
                'bg-amber-500': status.id === 'review',
                'bg-green-500': status.id === 'completed',
              })} />
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{status.label}</h2>
              <span className="text-xs text-gray-400">({statusTasks.length})</span>
            </div>
            <div className="space-y-2">
              {statusTasks.map(task => {
                const project = task.project as { id: string; name: string; color: string } | null
                return (
                  <Link
                    key={task.id}
                    href={`/freelancer/tasks/${task.id}`}
                    className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow"
                  >
                    {project && (
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      {project && <p className="text-xs text-gray-400 mt-0.5">{project.name}</p>}
                    </div>
                    {task.due_date && (
                      <span className={cn(
                        'text-xs shrink-0',
                        isOverdue(task.due_date) && task.status !== 'completed' ? 'text-red-500 font-medium' :
                        isDueSoon(task.due_date) ? 'text-amber-500' : 'text-gray-400'
                      )}>
                        {formatDateTime(task.due_date)}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}

      {allTasks.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No tasks assigned to you yet.</p>
        </div>
      )}
    </div>
  )
}
