import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { CreateTaskButton } from '@/components/tasks/CreateTaskButton'
import { DeleteProjectButton } from '@/components/projects/DeleteProjectButton'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { Task, Profile } from '@/lib/types/app.types'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: project }, { data: tasks }, { data: profile }, { data: freelancers }] =
    await Promise.all([
      supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single(),
      supabase
        .from('tasks')
        .select('*, assignee:profiles!assigned_to(id, full_name, email, avatar_url)')
        .eq('project_id', projectId)
        .order('sort_order'),
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single(),
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'freelancer'),
    ])

  if (!project) notFound()

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <Link
            href="/admin/projects"
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-2 transition-colors w-fit"
          >
            <ChevronLeft className="w-3 h-3" />
            Projects
          </Link>
          <div className="flex items-center gap-2.5">
            <div
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: project.color }}
            />
            <h1 className="text-2xl font-bold text-slate-900 truncate">{project.name}</h1>
          </div>
          {project.description && (
            <p className="text-sm text-slate-500 mt-1">{project.description}</p>
          )}
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <DeleteProjectButton projectId={projectId} />
            <CreateTaskButton
              projectId={projectId}
              freelancers={(freelancers ?? []) as Pick<Profile, 'id' | 'full_name' | 'email'>[]}
            />
          </div>
        )}
      </div>

      {/* Kanban board */}
      <KanbanBoard
        initialTasks={(tasks ?? []) as Task[]}
        projectId={projectId}
        isAdmin={isAdmin}
      />
    </div>
  )
}
