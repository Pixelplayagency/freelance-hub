import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ProjectTaskList } from '@/components/projects/ProjectTaskList'
import { CreateTaskButton } from '@/components/tasks/CreateTaskButton'
import { DeleteProjectButton } from '@/components/projects/DeleteProjectButton'
import {
  ChevronLeft, Instagram, Facebook,
  CheckCircle2, Clock, RotateCcw, Circle,
} from 'lucide-react'
import Link from 'next/link'
import type { Task, Profile, TaskStatus } from '@/lib/types/app.types'

type AssigneeMap = Record<string, Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[]>

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" />
    </svg>
  )
}

const STAT_CONFIG: { status: TaskStatus; label: string; icon: React.FC<{ className?: string }>; color: string; bg: string }[] = [
  { status: 'todo',        label: 'To Do',       icon: ({ className }) => <Circle className={className} />,        color: 'text-slate-500',  bg: 'bg-slate-100 dark:bg-slate-800/60'  },
  { status: 'in_progress', label: 'In Progress', icon: ({ className }) => <RotateCcw className={className} />,     color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/30'     },
  { status: 'review',      label: 'Review',      icon: ({ className }) => <Clock className={className} />,         color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/30'   },
  { status: 'completed',   label: 'Completed',   icon: ({ className }) => <CheckCircle2 className={className} />, color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/30'   },
]

const BAR_COLORS: Record<TaskStatus, string> = {
  todo:        'bg-slate-300',
  in_progress: 'bg-blue-400',
  review:      'bg-amber-400',
  completed:   'bg-green-500',
}

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
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('tasks').select('*, assignee:profiles!assigned_to(id, full_name, email, avatar_url)').eq('project_id', projectId).order('sort_order'),
      supabase.from('profiles').select('role').eq('id', user.id).single(),
      supabase.from('profiles').select('id, full_name, email').eq('role', 'freelancer'),
    ])

  if (!project) notFound()

  const isAdmin = profile?.role === 'admin'

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
  const total = allTasks.length
  const counts: Record<TaskStatus, number> = {
    todo:        allTasks.filter(t => t.status === 'todo').length,
    in_progress: allTasks.filter(t => t.status === 'in_progress').length,
    review:      allTasks.filter(t => t.status === 'review').length,
    completed:   allTasks.filter(t => t.status === 'completed').length,
  }
  const completedPct = total > 0 ? Math.round((counts.completed / total) * 100) : 0
  const hasSocials = project.instagram_url || project.facebook_url || project.tiktok_url
  const initial = project.name.charAt(0).toUpperCase()

  return (
    <div className="flex flex-col gap-5">
      {/* Back link */}
      <Link
        href="/admin/projects"
        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors w-fit"
      >
        <ChevronLeft className="w-3 h-3" />
        Projects
      </Link>

      {/* Hero card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Cover */}
        <div className="relative h-36 overflow-hidden">
          {project.cover_image_url ? (
            <img src={project.cover_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: `linear-gradient(135deg, ${project.color}cc 0%, ${project.color} 100%)` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Body */}
        <div className="px-5 pb-5 -mt-9 relative">
          {/* Avatar + actions row */}
          <div className="flex items-end justify-between gap-3 mb-3">
            <div className="w-16 h-16 rounded-2xl border-4 border-card bg-card overflow-hidden shadow-lg shrink-0">
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
            {isAdmin && (
              <div className="flex items-center gap-2 shrink-0 pb-1">
                <DeleteProjectButton projectId={projectId} />
                <CreateTaskButton
                  projectId={projectId}
                  freelancers={(freelancers ?? []) as Pick<Profile, 'id' | 'full_name' | 'email'>[]}
                />
              </div>
            )}
          </div>

          {/* Name + socials */}
          <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
            <h1 className="text-xl font-bold text-foreground leading-tight">{project.name}</h1>
            {hasSocials && (
              <div className="flex items-center gap-1.5 shrink-0">
                {project.instagram_url && (
                  <a href={project.instagram_url} target="_blank" rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-[#E1306C] hover:bg-muted transition-all">
                    <Instagram className="w-3.5 h-3.5" />
                  </a>
                )}
                {project.facebook_url && (
                  <a href={project.facebook_url} target="_blank" rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-[#1877F2] hover:bg-muted transition-all">
                    <Facebook className="w-3.5 h-3.5" />
                  </a>
                )}
                {project.tiktok_url && (
                  <a href={project.tiktok_url} target="_blank" rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                    <TikTokIcon className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {project.description && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{project.description}</p>
          )}

          {/* Stat chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {STAT_CONFIG.map(({ status, label, icon: Icon, color, bg }) => (
              <div key={status} className={`rounded-xl px-3 py-2 flex items-center gap-2 ${bg}`}>
                <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                <div>
                  <p className={`text-base font-bold leading-none ${color}`}>{counts[status]}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{total} task{total !== 1 ? 's' : ''} total</span>
                <span className="text-xs font-semibold text-foreground">{completedPct}% complete</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden bg-muted flex gap-px">
                {(['todo', 'in_progress', 'review', 'completed'] as TaskStatus[]).map(s => {
                  const pct = total > 0 ? (counts[s] / total) * 100 : 0
                  if (pct === 0) return null
                  return (
                    <div key={s} className={`h-full transition-all ${BAR_COLORS[s]}`} style={{ width: `${pct}%` }} />
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task list */}
      <ProjectTaskList
        tasks={allTasks}
        projectId={projectId}
        isAdmin={isAdmin}
        assigneeMap={assigneeMap}
      />
    </div>
  )
}
