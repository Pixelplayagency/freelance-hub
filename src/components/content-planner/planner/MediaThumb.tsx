import { Play } from 'lucide-react'
import type { MediaItem } from '@/lib/types/app.types'
import { thumbUrl } from './types'

interface MediaThumbProps {
  items: MediaItem[]
  className?: string
  showCount?: boolean
  rounded?: string
}

export function MediaThumb({ items, className = '', showCount = true, rounded = 'rounded-lg' }: MediaThumbProps) {
  if (!items.length) {
    return (
      <div className={`${className} ${rounded} bg-muted/40 border border-border/50 flex items-center justify-center`}>
        <span className="text-[10px] text-muted-foreground/60">No media</span>
      </div>
    )
  }
  const item = items[0]
  return (
    <div className={`${className} ${rounded} relative overflow-hidden bg-muted`}>
      {item.type === 'video' ? (
        <>
          <video src={item.url} className="w-full h-full object-cover" muted playsInline />
          <div className="absolute inset-0 bg-black/15 flex items-center justify-center">
            <Play className="w-4 h-4 text-white fill-white drop-shadow" />
          </div>
        </>
      ) : (
        <img src={thumbUrl(item.url)} alt="" className="w-full h-full object-cover" loading="lazy" />
      )}
      {showCount && items.length > 1 && (
        <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-[9px] text-white font-bold leading-none">
          +{items.length - 1}
        </div>
      )}
    </div>
  )
}
