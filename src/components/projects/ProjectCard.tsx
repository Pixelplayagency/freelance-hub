import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Project } from '@/lib/types/app.types'

interface ProjectCardProps {
  project: Project & { task_count?: number }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const initial = project.name.charAt(0).toUpperCase()

  return (
    <Link href={`/admin/projects/${project.id}`} className="group block">
      <div className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        {/* Colored header */}
        <div
          className="h-20 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${project.color}cc, ${project.color})` }}
        >
          <span className="text-3xl font-bold text-white/90 select-none">{initial}</span>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex items-start gap-2 mb-1">
            <h3 className="font-semibold text-foreground flex-1 leading-snug">{project.name}</h3>
            {project.status === 'archived' && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                Archived
              </span>
            )}
          </div>
          {project.description ? (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{project.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No description</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 flex items-center justify-between">
          {typeof project.task_count === 'number' ? (
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {project.task_count} task{project.task_count !== 1 ? 's' : ''}
            </span>
          ) : (
            <span />
          )}
          <span className="text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: '#f24a49' }}>
            Open <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}
