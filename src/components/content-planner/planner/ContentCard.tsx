'use client'

import { Clock, MessageSquare, Maximize2 } from 'lucide-react'
import { PlatformIcon } from './PlatformIcon'
import { StatusBadge } from './StatusBadge'
import { ContentTypeChip } from './ContentTypeChip'
import { MediaThumb } from './MediaThumb'
import { entryMediaItems, to12h, type EntryWithCreator } from './types'

interface ContentCardProps {
  entry: EntryWithCreator
  active?: boolean
  onClick: () => void
  readOnly?: boolean
}

export function ContentCard({ entry, active, onClick, readOnly }: ContentCardProps) {
  const media = entryMediaItems(entry)
  const creatorName = entry.creator?.full_name || entry.creator?.username || ''
  const initials = creatorName
    .split(' ')
    .map(s => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const hasComments = !!entry.client_comments

  if (readOnly) {
    return (
      <button
        onClick={onClick}
        className="group/card w-full text-left rounded-2xl overflow-hidden bg-card border border-border shadow-sm hover:shadow-lg transition-shadow duration-300"
      >
        {/* Media — zooms in gently on hover */}
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-muted">
          <MediaThumb
            items={media}
            className="w-full h-full [&_img]:transition-transform [&_img]:duration-500 [&_img]:ease-out group-hover/card:[&_img]:scale-110 [&_video]:transition-transform [&_video]:duration-500 [&_video]:ease-out group-hover/card:[&_video]:scale-110"
            rounded="rounded-none"
          />
          <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/10 transition-colors duration-300 flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover/card:opacity-100 scale-90 group-hover/card:scale-100 transition-all duration-300">
              <Maximize2 className="w-4 h-4 text-foreground" />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between gap-1.5">
            <ContentTypeChip type={entry.content_type} size="sm" />
            <StatusBadge entry={entry} size="sm" />
          </div>

          {entry.caption && (
            <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3">
              {entry.caption}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/60">
            <div className="flex items-center gap-1.5 min-w-0">
              {entry.platforms?.slice(0, 3).map(p => (
                <PlatformIcon key={p} platform={p} size={16} />
              ))}
            </div>
            {entry.scheduled_time && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium tabular-nums shrink-0">
                <Clock className="w-3 h-3" />
                {to12h(entry.scheduled_time)}
              </span>
            )}
          </div>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`group/card w-full text-left rounded-xl overflow-hidden bg-card border transition-all hover:shadow-md ${
        active ? 'border-primary shadow-md ring-2 ring-primary/20' : 'border-border hover:border-border/80'
      }`}
    >
      {/* Media */}
      <MediaThumb items={media} className="w-full aspect-[4/3]" rounded="rounded-none" />

      {/* Body */}
      <div className="p-2 space-y-1.5">
        {/* Title row: type chip + status */}
        <div className="flex items-center justify-between gap-1">
          <ContentTypeChip type={entry.content_type} size="xs" />
          <StatusBadge entry={entry} size="xs" />
        </div>

        {/* Caption preview */}
        {entry.caption && (
          <p className="text-[11px] leading-snug text-foreground/80 line-clamp-2 font-medium">
            {entry.caption}
          </p>
        )}

        {/* Footer: platforms, time, assignee, comments */}
        <div className="flex items-center justify-between gap-1 pt-1">
          <div className="flex items-center gap-1 min-w-0">
            {entry.platforms?.slice(0, 3).map(p => (
              <PlatformIcon key={p} platform={p} size={12} />
            ))}
            {entry.scheduled_time && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground font-medium tabular-nums ml-1">
                <Clock className="w-2.5 h-2.5" />
                {to12h(entry.scheduled_time)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {hasComments && (
              <MessageSquare className="w-2.5 h-2.5 text-muted-foreground" />
            )}
            {initials && (
              <span
                className="w-4 h-4 rounded-full text-[8px] font-bold text-white flex items-center justify-center"
                style={{ backgroundColor: 'var(--primary)' }}
                title={creatorName}
              >
                {initials}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
