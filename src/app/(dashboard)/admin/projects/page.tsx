import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Project } from '@/lib/types/app.types'

export default async function ProjectsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*, tasks(count)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const projectsWithCount = (projects ?? []).map(p => ({
    ...p,
    task_count: (p.tasks as unknown as { count: number }[])?.[0]?.count ?? 0,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500 mt-0.5">{projectsWithCount.length} active project{projectsWithCount.length !== 1 ? 's' : ''}</p>
        </div>
        <Button asChild className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm">
          <Link href="/admin/projects/new">
            <Plus className="w-4 h-4 mr-1.5" />
            New project
          </Link>
        </Button>
      </div>

      {projectsWithCount.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
            <Plus className="w-6 h-6 text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">No projects yet</p>
          <p className="text-xs text-slate-400 mb-5">Create your first project to get started</p>
          <Button asChild className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm">
            <Link href="/admin/projects/new">Create your first project</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectsWithCount.map(p => (
            <ProjectCard key={p.id} project={p as Project & { task_count: number }} />
          ))}
        </div>
      )}
    </div>
  )
}
