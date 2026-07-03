'use client'

import { Image as ImageIcon, Film, Layers, Play } from 'lucide-react'
import type { ContentType } from '@/lib/types/app.types'
import { PlatformIcon } from './PlatformIcon'
import {
  CONTENT_TYPE_META, entryMediaItems, getDisplayStatus, thumbUrl, to12h,
  type EntryWithCreator,
} from './types'

const TYPE_ICONS: Record<ContentType, typeof ImageIcon> = {
  post: ImageIcon,
  reel: Film,
  story: Layers,
}

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

interface FeedPreviewGridProps {
  entries: EntryWithCreator[]
  activeDate: string | null
  onSelectEntry: (entry: EntryWithCreator) => void
}

export function FeedPreviewGrid({ entries, activeDate, onSelectEntry }: FeedPreviewGridProps) {
  const sorted = [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    return (a.scheduled_time || '').localeCompare(b.scheduled_time || '')
  })

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 flex flex-col items-center justify-center text-center gap-2">
        <Layers className="w-6 h-6 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">Nothing scheduled this month</p>
        <p className="text-xs text-muted-foreground/60">Content added on the Calendar view will show up here as a feed preview.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5">
        {sorted.map(entry => (
          <FeedTile
            key={entry.id}
            entry={entry}
            active={activeDate === entry.date}
            onClick={() => onSelectEntry(entry)}
          />
        ))}
      </div>
    </div>
  )
}

function FeedTile({ entry, active, onClick }: { entry: EntryWithCreator; active: boolean; onClick: () => void }) {
  const media = entryMediaItems(entry)
  const first = media[0]
  const meta = CONTENT_TYPE_META[entry.content_type]
  const Icon = TYPE_ICONS[entry.content_type]
  const status = getDisplayStatus(entry)
  const d = new Date(entry.date + 'T00:00:00')
  const dateLabel = `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`

  return (
    <button
      onClick={onClick}
      className={`group/tile relative aspect-square rounded-lg overflow-hidden bg-muted transition-all hover:z-10 hover:shadow-lg hover:scale-[1.03] ${
        active ? 'ring-2 ring-primary ring-offset-1' : ''
      }`}
    >
      {/* Media / fallback */}
      {first ? (
        first.type === 'video' ? (
          <>
            <video src={first.url} poster={entry.thumbnail_url ?? undefined} className="w-full h-full object-cover" muted playsInline />
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white drop-shadow" />
            </div>
          </>
        ) : (
          <img src={thumbUrl(first.url)} alt="" className="w-full h-full object-cover" loading="lazy" />
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: meta.bgVar }}>
          <Icon className="w-6 h-6" style={{ color: meta.color }} />
        </div>
      )}

      {/* Status dot */}
      <span
        className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-1 ring-white/70"
        style={{ backgroundColor: status.color }}
        title={status.label}
      />

      {/* Type badge */}
      <span
        className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
        title={meta.label}
      >
        <Icon className="w-2.5 h-2.5 text-white" />
      </span>

      {/* Bottom gradient with date/time/platforms */}
      <div className="absolute inset-x-0 bottom-0 px-1.5 pt-4 pb-1 bg-gradient-to-t from-black/70 via-black/25 to-transparent">
        <div className="flex items-center justify-between gap-1">
          <p className="text-[10px] font-bold text-white leading-tight tabular-nums">{dateLabel}</p>
          {entry.platforms?.length > 0 && (
            <div className="flex items-center gap-0.5 shrink-0">
              {entry.platforms.slice(0, 4).map(p => (
                <PlatformIcon key={p} platform={p} size={10} className="rounded-[2px]" />
              ))}
            </div>
          )}
        </div>
        {entry.scheduled_time && (
          <p className="text-[9px] text-white/85 leading-tight tabular-nums">{to12h(entry.scheduled_time)}</p>
        )}
      </div>

      {/* Hover caption overlay */}
      {entry.caption && (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/tile:opacity-100 transition-opacity flex items-center justify-center p-2">
          <p className="text-[10px] text-white text-center leading-snug line-clamp-4">{entry.caption}</p>
        </div>
      )}
    </button>
  )
}
