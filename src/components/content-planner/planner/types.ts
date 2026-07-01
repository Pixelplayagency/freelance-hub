import type { ContentPlan, ContentPlanStatus, ContentType, MediaItem, Profile } from '@/lib/types/app.types'

export type FilterStatus = 'all' | 'scheduled' | 'in_review' | 'approved' | 'rejected' | 'published' | 'not_posted'
export type FilterPlatform = 'all' | 'instagram' | 'facebook' | 'tiktok' | 'linkedin'
export type FilterType = 'all' | ContentType

export interface PlannerFilters {
  search: string
  platform: FilterPlatform
  status: FilterStatus
  type: FilterType
}

export type EntryWithCreator = ContentPlan & {
  creator?: Pick<Profile, 'full_name' | 'username' | 'avatar_url'> | null
}

export interface PanelDraft {
  date: string
  entry: EntryWithCreator | null
  content_type: ContentType
  platforms: string[]
  scheduled_time: string
  tbc: string
  caption: string
  client_comments: string
  media_items: MediaItem[]
  status: ContentPlanStatus
  uploading: boolean
}

export const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', color: '#E1306C' },
  { id: 'facebook',  label: 'Facebook',  color: '#1877F2' },
  { id: 'tiktok',    label: 'TikTok',    color: '#010101' },
  { id: 'linkedin',  label: 'LinkedIn',  color: '#0A66C2' },
] as const

export const CONTENT_TYPE_META: Record<ContentType, { label: string; color: string; bgVar: string }> = {
  post:  { label: 'Image',  color: '#15803d', bgVar: 'rgba(187,247,208,0.55)' },
  story: { label: 'Story', color: '#b91c1c', bgVar: 'rgba(254,202,202,0.55)' },
  reel:  { label: 'Reel',  color: '#a16207', bgVar: 'rgba(254,240,138,0.55)' },
}

export function getDisplayStatus(entry: ContentPlan): { label: string; color: string; bg: string } {
  if (entry.caption_rejected || entry.post_rejected)
    return { label: 'Rejected', color: '#dc2626', bg: 'rgba(254,226,226,0.5)' }
  if (entry.post_approved && entry.caption_approved)
    return { label: 'Approved', color: '#059669', bg: 'rgba(220,252,231,0.5)' }
  if (entry.caption_approved || entry.post_approved)
    return { label: 'Approved', color: '#059669', bg: 'rgba(220,252,231,0.5)' }
  if (entry.approval_requested)
    return { label: 'In review', color: '#d97706', bg: 'rgba(254,243,199,0.5)' }
  if (entry.status === 'posted')
    return { label: 'Published', color: '#059669', bg: 'rgba(220,252,231,0.4)' }
  if (entry.status === 'not_posted')
    return { label: 'Pending', color: '#f59e0b', bg: 'rgba(254,243,199,0.5)' }
  return { label: 'Scheduled', color: '#2563eb', bg: 'rgba(219,234,254,0.45)' }
}

export function entryMediaItems(entry: ContentPlan | null): MediaItem[] {
  if (!entry) return []
  if (entry.media_items?.length) return entry.media_items
  if (entry.media_url) return [{ url: entry.media_url, type: entry.media_type ?? 'image' }]
  return []
}

export function makeDraft(date: string, entry: EntryWithCreator | null): PanelDraft {
  return {
    date,
    entry,
    content_type: entry?.content_type ?? 'post',
    platforms: entry?.platforms ?? [],
    scheduled_time: entry?.scheduled_time ?? '',
    tbc: entry?.tbc ?? '',
    caption: entry?.caption ?? '',
    client_comments: entry?.client_comments ?? '',
    media_items: entryMediaItems(entry),
    status: entry?.status ?? 'scheduled',
    uploading: false,
  }
}

export function to12h(time: string) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export function thumbUrl(url: string) {
  return url.replace('/upload/', '/upload/w_400,h_400,c_fill,q_auto,f_auto/')
}

export function toDateString(d: Date) {
  return d.toISOString().split('T')[0]
}

export function getCalendarWeeks(year: number, month: number): Date[][] {
  const weeks: Date[][] = []
  const lastDay = new Date(year, month + 1, 0)
  const start = new Date(year, month, 1)
  start.setDate(start.getDate() - start.getDay())
  const cur = new Date(start)
  while (cur <= lastDay || cur.getDay() !== 0) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur))
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
    if (cur > lastDay && cur.getDay() === 0) break
  }
  return weeks
}
