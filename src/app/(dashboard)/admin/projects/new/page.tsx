import { ProjectForm } from '@/components/projects/ProjectForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function NewProjectPage() {
  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/admin/projects"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Projects
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-foreground mb-6">New project</h1>
      <div className="bg-card rounded-xl border border-border p-6">
        <ProjectForm />
      </div>
    </div>
  )
}
