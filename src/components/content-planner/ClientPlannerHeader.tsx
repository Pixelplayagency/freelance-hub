import Link from 'next/link'
import { Instagram, Facebook, CalendarDays, type LucideIcon } from 'lucide-react'
import { ClientPdfSection } from './ClientPdfSection'
import type { ContentClient } from '@/lib/types/app.types'

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.2 8.2 0 004.79 1.53V6.82a4.85 4.85 0 01-1.02-.13z" />
    </svg>
  )
}

interface SecondaryView {
  id: string
  label: string
  icon: LucideIcon
}

interface ClientPlannerHeaderProps {
  client: ContentClient
  basePath: string
  view: string
  month: number
  year: number
  monthName: string
  postCount: number
  reelCount: number
  storyCount: number
  pdfSignedUrl: string | null
  canEditPdf: boolean
  clientId: string
  secondaryView: SecondaryView
}

export function ClientPlannerHeader({
  client, basePath, view, month, year, monthName,
  postCount, reelCount, storyCount, pdfSignedUrl, canEditPdf, clientId, secondaryView,
}: ClientPlannerHeaderProps) {
  const hasSocials = client.instagram_url || client.facebook_url || client.tiktok_url
  const SecondaryIcon = secondaryView.icon

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Accent bar */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, var(--primary) 0%, color-mix(in oklch, var(--primary), transparent 65%) 100%)' }} />

      {/* Top row: avatar + name + socials — stats + view toggle */}
      <div className="flex items-center justify-between gap-4 px-4 pt-3.5 pb-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          {client.avatar_url ? (
            <img src={client.avatar_url} alt="" className="w-11 h-11 rounded-xl object-cover border border-border shrink-0" />
          ) : (
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
              style={{ background: client.color }}
            >
              {client.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-foreground leading-tight truncate">{client.name}</h1>
            {hasSocials && (
              <div className="flex items-center gap-1 mt-1">
                {client.instagram_url && (
                  <a href={client.instagram_url} target="_blank" rel="noopener noreferrer"
                    className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                    <Instagram className="w-3.5 h-3.5" />
                  </a>
                )}
                {client.facebook_url && (
                  <a href={client.facebook_url} target="_blank" rel="noopener noreferrer"
                    className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                    <Facebook className="w-3.5 h-3.5" />
                  </a>
                )}
                {client.tiktok_url && (
                  <a href={client.tiktok_url} target="_blank" rel="noopener noreferrer"
                    className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                    <TikTokIcon className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Stats — single divided pill instead of separate boxes */}
          <div className="flex items-center gap-px bg-background border border-border rounded-lg overflow-hidden">
            <Stat value={postCount} label="Posts" />
            <div className="w-px h-8 bg-border" />
            <Stat value={reelCount} label="Reels" />
            <div className="w-px h-8 bg-border" />
            <Stat value={storyCount} label="Stories" />
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-xl border border-border">
            <Link
              href={`${basePath}?view=calendar&month=${month}&year=${year}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === 'calendar'
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Calendar
            </Link>
            <Link
              href={`${basePath}?view=${secondaryView.id}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                view === secondaryView.id
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <SecondaryIcon className="w-3.5 h-3.5" />
              {secondaryView.label}
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom row: month label + PDF / reference link */}
      <div className="border-t border-border flex items-center gap-3 px-4 py-2.5 bg-muted/20 flex-wrap">
        <p className="text-xs text-muted-foreground font-medium">
          Monthly content schedule — <span className="text-foreground font-semibold">{monthName}</span>
        </p>
        <ClientPdfSection
          clientId={clientId}
          pdfUrl={pdfSignedUrl}
          hasPdf={!!client.content_plan_pdf_path}
          hasLink={!!client.content_plan_link}
          linkUrl={client.content_plan_link}
          canEdit={canEditPdf}
        />
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="px-4 py-2 text-center">
      <p className="text-xl font-bold text-foreground tabular-nums tracking-tight leading-none">{value}</p>
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-none mt-1.5">{label}</p>
    </div>
  )
}
