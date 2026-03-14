'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Clock, Eye, Loader2, Image as ImageIcon } from 'lucide-react'
import { approveCaption, approvePost } from '@/lib/actions/content-plan.actions'
import type { ContentPlan, ContentPlanStatus, ContentType } from '@/lib/types/app.types'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

const TYPE_LABELS: Record<ContentType, string> = { post: 'POST', story: 'STORY', reel: 'REEL' }
const TYPE_COLORS: Record<ContentType, string> = { post: '#15803d', story: '#b91c1c', reel: '#a16207' }
const TYPE_BG: Record<ContentType, string> = { post: '#bbf7d0', story: '#fecaca', reel: '#fef08a' }
const STATUS_LABELS: Record<ContentPlanStatus, string> = { scheduled: 'Scheduled', posted: 'Posted', not_posted: 'Not Posted' }
const STATUS_DOT: Record<ContentPlanStatus, string> = { scheduled: '#3b82f6', posted: '#16a34a', not_posted: '#dc2626' }

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  instagram: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad-a)" />
      <circle cx="12" cy="12" r="4.2" stroke="white" strokeWidth="1.8" fill="none" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="white" />
      <defs>
        <linearGradient id="ig-grad-a" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f09433" /><stop offset="25%" stopColor="#e6683c" />
          <stop offset="50%" stopColor="#dc2743" /><stop offset="75%" stopColor="#cc2366" />
          <stop offset="100%" stopColor="#bc1888" />
        </linearGradient>
      </defs>
    </svg>
  ),
  facebook: (
    <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path d="M15.12 7.8h-1.7c-.57 0-.68.27-.68.68v1.1h2.38l-.31 2.38h-2.07V19h-2.46v-7.04H8.88V9.58h1.4V8.36C10.28 6.4 11.42 5.4 13.2 5.4c.85 0 1.75.07 2.6.14L15.12 7.8z" fill="white" />
    </svg>
  ),
  tiktok: (
    <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="#010101" />
      <path d="M16.6 8.2a3.6 3.6 0 0 1-2.2-1.9V5.4h-1.9v8.7a1.7 1.7 0 0 1-1.7 1.5 1.7 1.7 0 0 1-1.7-1.7 1.7 1.7 0 0 1 1.7-1.7l.4.1V10a4 4 0 0 0-.4 0 3.7 3.7 0 0 0-3.7 3.7 3.7 3.7 0 0 0 7.4 0V9.1a5.5 5.5 0 0 0 2.7.8V8a3.7 3.7 0 0 1-.6-.1z" fill="white" />
    </svg>
  ),
}

function thumbUrl(url: string) { return url.replace('/upload/', '/upload/w_200,h_200,c_fill,q_auto,f_auto/') }
function to12h(time: string) {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')}${h >= 12 ? 'pm' : 'am'}`
}
function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

export function ContentPlannerAdminList({ entries: initialEntries }: { entries: ContentPlan[] }) {
  const [isPending, startTransition] = useTransition()
  const [entries, setEntries] = useState<ContentPlan[]>(initialEntries)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [lightbox, setLightbox] = useState<{ url: string; type: 'image' | 'video' } | null>(null)

  const filtered = entries.filter(e => {
    if (filter === 'pending') return e.approval_requested && !e.caption_approved && !e.post_approved
    if (filter === 'approved') return e.caption_approved || e.post_approved
    return true
  }).sort((a, b) => a.date.localeCompare(b.date))

  const pendingCount = entries.filter(e => e.approval_requested && !e.caption_approved && !e.post_approved).length

  function handleApproveCaption(entry: ContentPlan) {
    const next = !entry.caption_approved
    startTransition(async () => {
      await approveCaption(entry.id, next)
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, caption_approved: next } : e))
    })
  }

  function handleApprovePost(entry: ContentPlan) {
    const next = !entry.post_approved
    startTransition(async () => {
      await approvePost(entry.id, next)
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, post_approved: next } : e))
    })
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Clock className="w-5 h-5 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No content plans yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Entries added by the freelancer will appear here</p>
      </div>
    )
  }

  return (
    <>
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {([
          { key: 'all', label: 'All', count: entries.length },
          { key: 'pending', label: 'Pending Review', count: pendingCount },
          { key: 'approved', label: 'Approved', count: entries.filter(e => e.caption_approved || e.post_approved).length },
        ] as const).map(({ key, label, count }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filter === key
                ? 'bg-[#f24a49] text-white border-[#f24a49]'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
            }`}>
            {label}
            {count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                filter === key ? 'bg-white/20' : key === 'pending' && count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
              }`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Entry list */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          No entries in this filter
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => (
            <div key={entry.id}
              className={`rounded-xl border bg-card overflow-hidden transition-all ${
                entry.approval_requested && !entry.caption_approved && !entry.post_approved
                  ? 'border-amber-200 shadow-sm shadow-amber-100'
                  : 'border-border'
              }`}>
              <div className="flex gap-0 items-stretch">
                {/* Media thumbnail */}
                <div className="relative shrink-0 w-24 bg-muted flex items-center justify-center overflow-hidden">
                  {entry.media_url ? (
                    <>
                      {entry.media_type === 'video'
                        ? <video src={entry.media_url} className="w-full h-full object-cover" muted />
                        : <img src={thumbUrl(entry.media_url)} alt="" className="w-full h-full object-cover" />}
                      <button
                        onClick={() => setLightbox({ url: entry.media_url!, type: entry.media_type! })}
                        className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-4 h-4 text-white" />
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground/20" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    {/* Left: date + meta */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{fmtDate(entry.date)}</span>
                      {entry.scheduled_time && (
                        <span className="text-xs font-semibold text-muted-foreground tabular-nums">{to12h(entry.scheduled_time)}</span>
                      )}
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: TYPE_BG[entry.content_type], color: TYPE_COLORS[entry.content_type] }}>
                        {TYPE_LABELS[entry.content_type]}
                      </span>
                      {entry.platforms?.length > 0 && (
                        <div className="flex gap-1 items-center">
                          {entry.platforms.map(pid => (
                            <span key={pid} className="w-4 h-4 shrink-0">{PLATFORM_ICONS[pid]}</span>
                          ))}
                        </div>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_DOT[entry.status] }} />
                        {STATUS_LABELS[entry.status]}
                      </span>
                    </div>

                    {/* Right: approval status badge */}
                    <div className="shrink-0">
                      {entry.caption_approved && entry.post_approved ? (
                        <span className="text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-200">✓ Fully Approved</span>
                      ) : entry.approval_requested && !entry.caption_approved && !entry.post_approved ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Pending Review
                        </span>
                      ) : (entry.caption_approved || entry.post_approved) ? (
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                          {entry.caption_approved ? '✓ Caption' : ''}{entry.caption_approved && entry.post_approved ? ' · ' : ''}{entry.post_approved ? '✓ Post' : ''}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Caption */}
                  {entry.caption && (
                    <p className="text-sm text-foreground/80 leading-relaxed mb-3 line-clamp-3">{entry.caption}</p>
                  )}

                  {/* Freelancer submitted note */}
                  {entry.approval_requested && (
                    <p className="text-[11px] text-amber-600 mb-2">⚡ Freelancer submitted for review</p>
                  )}

                  {/* Client comments */}
                  {entry.client_comments && (
                    <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg mb-3 italic">"{entry.client_comments}"</p>
                  )}

                  {/* Approve buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => handleApproveCaption(entry)} disabled={isPending}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50"
                      style={entry.caption_approved
                        ? { backgroundColor: '#dcfce7', color: '#15803d', borderColor: '#86efac' }
                        : { borderColor: '#e5e7eb', color: '#6b7280' }}>
                      <CheckCircle2 className="w-3 h-3" />
                      {entry.caption_approved ? 'Caption Approved' : 'Approve Caption'}
                    </button>
                    <button onClick={() => handleApprovePost(entry)} disabled={isPending}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50"
                      style={entry.post_approved
                        ? { backgroundColor: '#dcfce7', color: '#15803d', borderColor: '#86efac' }
                        : { borderColor: '#e5e7eb', color: '#6b7280' }}>
                      <CheckCircle2 className="w-3 h-3" />
                      {entry.post_approved ? 'Post Approved' : 'Approve Post'}
                    </button>
                    {isPending && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground self-center" />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85" onClick={() => setLightbox(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightbox(null)} className="absolute -top-9 right-0 text-white/60 hover:text-white transition-colors text-sm">✕</button>
            {lightbox.type === 'video'
              ? <video src={lightbox.url} className="w-full max-h-[80vh] rounded-xl object-contain" controls autoPlay />
              : <img src={lightbox.url} alt="" className="w-full max-h-[80vh] rounded-xl object-contain" />}
          </div>
        </div>
      )}
    </>
  )
}
