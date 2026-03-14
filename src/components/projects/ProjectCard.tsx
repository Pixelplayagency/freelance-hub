import Link from 'next/link'
import { ArrowRight, Instagram, Facebook } from 'lucide-react'
import type { Project } from '@/lib/types/app.types'

// Minimal TikTok SVG icon (not in lucide-react)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" />
    </svg>
  )
}

interface ProjectCardProps {
  project: Project & { task_count?: number }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const initial = project.name.charAt(0).toUpperCase()
  const hasSocials = project.instagram_url || project.facebook_url || project.tiktok_url

  function handleSocialClick(e: React.MouseEvent, url: string) {
    e.preventDefault()
    e.stopPropagation()
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Link href={`/admin/projects/${project.id}`} className="group block">
      <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">

        {/* Cover image / gradient banner */}
        <div className="relative h-28 overflow-hidden">
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

          {/* Archived badge */}
          {project.status === 'archived' && (
            <span className="absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wide bg-black/40 text-white px-2 py-0.5 rounded-full">
              Archived
            </span>
          )}
        </div>

        {/* Body — avatar overlapping cover */}
        <div className="px-4 pb-0 -mt-7 relative">
          {/* Avatar circle */}
          <div className="w-14 h-14 rounded-full border-2 border-card bg-card overflow-hidden shrink-0 mb-2 shadow-sm">
            {project.avatar_url ? (
              <img
                src={project.avatar_url}
                alt={project.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-xl font-bold text-white"
                style={{ backgroundColor: project.color }}
              >
                {initial}
              </div>
            )}
          </div>

          {/* Name + socials */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-semibold text-foreground leading-snug flex-1 min-w-0 truncate">
              {project.name}
            </h3>
            {hasSocials && (
              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                {project.instagram_url && (
                  <button
                    type="button"
                    onClick={e => handleSocialClick(e, project.instagram_url!)}
                    className="text-muted-foreground hover:text-[#E1306C] transition-colors"
                    title="Instagram"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                  </button>
                )}
                {project.facebook_url && (
                  <button
                    type="button"
                    onClick={e => handleSocialClick(e, project.facebook_url!)}
                    className="text-muted-foreground hover:text-[#1877F2] transition-colors"
                    title="Facebook"
                  >
                    <Facebook className="w-3.5 h-3.5" />
                  </button>
                )}
                {project.tiktok_url && (
                  <button
                    type="button"
                    onClick={e => handleSocialClick(e, project.tiktok_url!)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="TikTok"
                  >
                    <TikTokIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {project.description ? (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
              {project.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic mb-3">No description</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
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
