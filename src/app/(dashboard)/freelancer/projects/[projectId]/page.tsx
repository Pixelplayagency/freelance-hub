import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ProjectTaskList } from '@/components/projects/ProjectTaskList'
import { ChevronLeft, Instagram, Facebook } from 'lucide-react'
import Link from 'next/link'
import type { Task, Profile } from '@/lib/types/app.types'

type AssigneeMap = Record<string, Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[]>

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" />
    </svg>
  )
}

export default async function FreelancerProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: project }, { data: tasks }] = await Promise.all([
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
  ])

  if (!project) notFound()

  // Fetch co-assignees for all tasks
  const taskIds = (tasks ?? []).map(t => t.id)
  let assigneeMap: AssigneeMap = {}
  if (taskIds.length > 0) {
    const { data: assignments } = await supabase
      .from('task_assignments')
      .select('task_id, user:profiles!user_id(id, full_name, avatar_url)')
      .in('task_id', taskIds)
    for (const a of assignments ?? []) {
      if (!assigneeMap[a.task_id]) assigneeMap[a.task_id] = []
      assigneeMap[a.task_id].push(a.user as unknown as Pick<Profile, 'id' | 'full_name' | 'avatar_url'>)
    }
  }

  const allTasks = (tasks ?? []) as Task[]
  const todoCount = allTasks.filter(t => t.status !== 'completed').length
  const hasSocials = project.instagram_url || project.facebook_url || project.tiktok_url
  const initial = project.name.charAt(0).toUpperCase()

  return (
    <div className="flex flex-col h-full">
      {/* Back link */}
      <Link
        href="/freelancer/projects"
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4 transition-colors w-fit"
      >
        <ChevronLeft className="w-3 h-3" />
        Projects
      </Link>

      {/* Project hero card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
        {/* Cover */}
        <div className="relative h-32 overflow-hidden">
          {project.cover_image_url ? (
            <img
              src={project.cover_image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: `linear-gradient(135deg, ${project.color}cc, ${project.color})` }}
            />
          )}
        </div>

        {/* Body */}
        <div className="px-5 pb-5 -mt-8 relative">
          {/* Avatar overlapping cover */}
          <div className="w-16 h-16 rounded-full border-2 border-card bg-card overflow-hidden shrink-0 mb-3 shadow-md">
            {project.avatar_url ? (
              <img src={project.avatar_url} alt={project.name} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                style={{ backgroundColor: project.color }}
              >
                {initial}
              </div>
            )}
          </div>

          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground leading-snug">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{project.description}</p>
              )}
            </div>

            {/* Social icons */}
            {hasSocials && (
              <div className="flex items-center gap-2 shrink-0 mt-1">
                {project.instagram_url && (
                  <a
                    href={project.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[#E1306C] transition-colors"
                    title="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {project.facebook_url && (
                  <a
                    href={project.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[#1877F2] transition-colors"
                    title="Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
                {project.tiktok_url && (
                  <a
                    href={project.tiktok_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="TikTok"
                  >
                    <TikTokIcon className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Task summary */}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {allTasks.length} task{allTasks.length !== 1 ? 's' : ''} total
            </span>
            {todoCount > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#f24a49/10', color: '#f24a49', background: 'rgba(242,74,73,0.1)' }}>
                {todoCount} to do
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Task board */}
      <ProjectTaskList
        tasks={allTasks}
        projectId={projectId}
        isAdmin={false}
        assigneeMap={assigneeMap}
      />
    </div>
  )
}
