import { Image as ImageIcon, Film, Layers } from 'lucide-react'
import type { ContentType } from '@/lib/types/app.types'
import { CONTENT_TYPE_META } from './types'

const ICONS: Record<ContentType, typeof ImageIcon> = {
  post: ImageIcon,
  reel: Film,
  story: Layers,
}

export function ContentTypeChip({ type, size = 'sm' }: { type: ContentType; size?: 'sm' | 'xs' }) {
  const meta = CONTENT_TYPE_META[type]
  const Icon = ICONS[type]
  const isXs = size === 'xs'
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full leading-none ${
        isXs ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-1'
      }`}
      style={{ color: meta.color, backgroundColor: meta.bgVar }}
    >
      <Icon className={isXs ? 'w-2 h-2' : 'w-2.5 h-2.5'} />
      {meta.label}
    </span>
  )
}
