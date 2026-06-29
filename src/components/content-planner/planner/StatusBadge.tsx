import type { ContentPlan } from '@/lib/types/app.types'
import { getDisplayStatus } from './types'

export function StatusBadge({ entry, size = 'sm' }: { entry: ContentPlan; size?: 'sm' | 'xs' }) {
  const st = getDisplayStatus(entry)
  const isXs = size === 'xs'
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full leading-none ${
        isXs ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-1'
      }`}
      style={{ color: st.color, backgroundColor: st.bg }}
    >
      <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: st.color }} />
      {st.label}
    </span>
  )
}
