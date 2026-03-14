import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProjectCard } from '@/components/projects/ProjectCard'
import type { Project } from '@/lib/types/app.types'

export default async function FreelancerProjectsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get all active projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (!projects || projects.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Projects you have tasks in</p>
        </div>
        <div className="bg-card rounded-lg border border-border flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-medium text-muted-foreground">No projects yet</p>
          <p className="text-xs text-muted-foreground mt-1">You will see projects here once tasks are assigned to you</p>
        </div>
      </div>
    )
  }

  // Get task counts per project for this freelancer (co-assigned via task_assignments)
  const { data: coAssigned } = await supabase
    .from('task_assignments')
    .select('task_id')
    .eq('user_id', user.id)
  const coIds = (coAssigned ?? []).map((r: { task_id: string }) => r.task_id)

  const { data: myTasks } = await supabase
    .from('tasks')
    .select('project_id, status')
    .or(`assigned_to.eq.${user.id}${coIds.length > 0 ? `,id.in.(${coIds.join(',')})` : ''}`)
    .neq('status', 'completed')

  // Count incomplete tasks per project
  const taskCountMap: Record<string, number> = {}
  for (const t of myTasks ?? []) {
    taskCountMap[t.project_id] = (taskCountMap[t.project_id] ?? 0) + 1
  }

  // Only show projects where this freelancer has at least one task
  const projectsWithTasks = projects
    .map(p => ({ ...p, task_count: taskCountMap[p.id] ?? 0 }))
    .filter(p => p.task_count > 0 || (myTasks ?? []).some(t => t.project_id === p.id))

  // Show all projects but with their task counts (0 if none assigned)
  const projectsWithCount = projects.map(p => ({
    ...p,
    task_count: taskCountMap[p.id] ?? 0,
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {projectsWithCount.length} active project{projectsWithCount.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projectsWithCount.map(p => (
          <ProjectCard
            key={p.id}
            project={p as Project & { task_count: number }}
            readOnly
          />
        ))}
      </div>
    </div>
  )
}
