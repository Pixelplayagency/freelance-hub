'use client'

import { Clock, MessageSquare } from 'lucide-react'
import { PlatformIcon } from './PlatformIcon'
import { StatusBadge } from './StatusBadge'
import { ContentTypeChip } from './ContentTypeChip'
import { MediaThumb } from './MediaThumb'
import { entryMediaItems, to12h, type EntryWithCreator } from './types'

interface ContentCardProps {
  entry: EntryWithCreator
  active?: boolean
  onClick: () => void
}

export function ContentCard({ entry, active, onClick }: ContentCardProps) {
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
