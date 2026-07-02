'use client'

import { useState } from 'react'
import { X, Clock, Calendar, Play, Download, Loader2 } from 'lucide-react'
import { PlatformIcon } from '@/components/content-planner/planner/PlatformIcon'
import { StatusBadge } from '@/components/content-planner/planner/StatusBadge'
import { ContentTypeChip } from '@/components/content-planner/planner/ContentTypeChip'
import { entryMediaItems, to12h, type EntryWithCreator } from '@/components/content-planner/planner/types'

async function downloadMedia(url: string, name: string) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
  } catch {
    window.open(url, '_blank')
  }
}

export function ShareContentModal({ entry, onClose }: { entry: EntryWithCreator | null; onClose: () => void }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [downloading, setDownloading] = useState(false)

  if (!entry) return null
  const media = entryMediaItems(entry)
  const active = media[activeIdx]
  const dateLabel = new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  async function handleDownload() {
    if (!active) return
    setDownloading(true)
    const ext = active.type === 'video' ? 'mp4' : 'jpg'
    await downloadMedia(active.url, `${entry!.date}-${entry!.content_type}-${activeIdx + 1}.${ext}`)
    setDownloading(false)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl border border-border shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {active && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              title="Download"
              className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-colors disabled:opacity-60"
            >
              {downloading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Download className="w-4 h-4 text-white" />}
            </button>
          )}
          <button
            onClick={onClose}
            title="Close"
            className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Media */}
        {active && (
          <div className="w-full aspect-square sm:aspect-video bg-black flex items-center justify-center overflow-hidden rounded-t-2xl">
            {active.type === 'video' ? (
              <video src={active.url} className="w-full h-full object-contain" controls autoPlay />
            ) : (
              <img src={active.url} alt="" className="w-full h-full object-contain" />
            )}
          </div>
        )}

        {/* Thumbnail strip when multiple media items */}
        {media.length > 1 && (
          <div className="flex items-center gap-2 px-4 pt-3 overflow-x-auto">
            {media.map((m, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                  i === activeIdx ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                {m.type === 'video' ? (
                  <>
                    <video src={m.url} className="w-full h-full object-cover" muted />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play className="w-3 h-3 text-white fill-white" />
                    </div>
                  </>
                ) : (
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Details */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <ContentTypeChip type={entry.content_type} size="sm" />
            <StatusBadge entry={entry} size="sm" />
          </div>

          {entry.caption && (
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {entry.caption}
            </p>
          )}

          <div className="flex items-center gap-4 flex-wrap pt-3 border-t border-border">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Calendar className="w-3.5 h-3.5" />
              {dateLabel}
            </span>
            {entry.scheduled_time && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium tabular-nums">
                <Clock className="w-3.5 h-3.5" />
                {to12h(entry.scheduled_time)}
              </span>
            )}
            {entry.platforms?.length > 0 && (
              <div className="flex items-center gap-1.5">
                {entry.platforms.map(p => (
                  <PlatformIcon key={p} platform={p} size={16} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
