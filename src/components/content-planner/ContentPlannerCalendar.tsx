'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, X, Plus, Eye, Upload,
  Loader2, CheckCircle2, Image as ImageIcon, Check, Trash2, Send, Smile,
} from 'lucide-react'
import {
  createContentPlan, updateContentPlan, deleteContentPlan,
  approveCaption, approvePost, submitForApproval,
  rejectCaption, rejectPost,
} from '@/lib/actions/content-plan.actions'
import type { ContentPlan, ContentType, ContentPlanStatus, MediaItem } from '@/lib/types/app.types'

const CLOUD_NAME = 'desj9wmtd'
const UPLOAD_PRESET = 'task-uploads'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

const TYPE_LABELS: Record<ContentType, string> = { post: 'POST', story: 'STORY', reel: 'REEL' }
const TYPE_COLORS: Record<ContentType, string> = { post: '#15803d', story: '#b91c1c', reel: '#a16207' }
const TYPE_BG: Record<ContentType, string> = { post: '#bbf7d0', story: '#fecaca', reel: '#fef08a' }

const STATUS_LABELS: Record<ContentPlanStatus, string> = { scheduled: 'Scheduled', posted: 'Posted', not_posted: 'Not Posted' }
const STATUS_DOT: Record<ContentPlanStatus, string> = { scheduled: '#3b82f6', posted: '#16a34a', not_posted: '#dc2626' }

const PLATFORMS = [
  {
    id: 'instagram',
    label: 'Instagram',
    color: '#E1306C',
    icon: (size = 14) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad)" />
        <circle cx="12" cy="12" r="4.2" stroke="white" strokeWidth="1.8" fill="none" />
        <circle cx="17.2" cy="6.8" r="1.2" fill="white" />
        <defs>
          <linearGradient id="ig-grad" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="25%" stopColor="#e6683c" />
            <stop offset="50%" stopColor="#dc2743" />
            <stop offset="75%" stopColor="#cc2366" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    icon: (size = 14) => (
      <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill="#1877F2" />
        <path d="M15.12 7.8h-1.7c-.57 0-.68.27-.68.68v1.1h2.38l-.31 2.38h-2.07V19h-2.46v-7.04H8.88V9.58h1.4V8.36C10.28 6.4 11.42 5.4 13.2 5.4c.85 0 1.75.07 2.6.14L15.12 7.8z" fill="white" />
      </svg>
    ),
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    color: '#010101',
    icon: (size = 14) => (
      <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill="#010101" />
        <path d="M16.6 8.2a3.6 3.6 0 0 1-2.2-1.9V5.4h-1.9v8.7a1.7 1.7 0 0 1-1.7 1.5 1.7 1.7 0 0 1-1.7-1.7 1.7 1.7 0 0 1 1.7-1.7l.4.1V10a4 4 0 0 0-.4 0 3.7 3.7 0 0 0-3.7 3.7 3.7 3.7 0 0 0 7.4 0V9.1a5.5 5.5 0 0 0 2.7.8V8a3.7 3.7 0 0 1-.6-.1l.0 .3z" fill="white" />
        <path d="M16.2 9.9a5.5 5.5 0 0 0 2.4.6V8.7a3.7 3.7 0 0 1-2-.8" fill="#69C9D0" />
      </svg>
    ),
  },
]

const EMOJIS = [
  // Smileys
  '😀','😂','😍','🥰','😎','🤩','😜','😏','🥺','😭','🤔','😮','🙄','🥳','🤗','😤','😡','😴','🫠','🥹',
  // Hearts & hands
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','💖','💯','👍','👏','🙌','💪','🤞','✌️','🫶','🤝','👋','🤜',
  // Nature
  '🌟','⭐','🌙','☀️','🌈','🔥','❄️','🌊','🌸','🌺','🌻','🍀','🌿','🦋','🐝','🌴','🏔️','🌙','💫','✨',
  // Food & drink
  '🍕','🍔','🍟','🌮','🍣','🍜','🍰','🎂','🍫','🍬','☕','🍷','🥂','🍻','🧃','🥤','🍓','🫐','🥑','🍋',
  // Activities & objects
  '💻','📱','🎵','🎶','📸','🎬','🏆','🥇','💰','🎁','💡','🚀','✈️','🏖️','🎉','🎊','📣','🔑','⚡','🌐',
]

function getWeeks(year: number, month: number): Date[][] {
  const weeks: Date[][] = []
  const lastDay = new Date(year, month + 1, 0)
  const start = new Date(year, month, 1)
  start.setDate(start.getDate() - start.getDay())
  const cur = new Date(start)
  while (cur <= lastDay || cur.getDay() !== 0) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) { week.push(new Date(cur)); cur.setDate(cur.getDate() + 1) }
    weeks.push(week)
    if (cur > lastDay && cur.getDay() === 0) break
  }
  return weeks
}

function toDS(d: Date) { return d.toISOString().split('T')[0] }
function thumbUrl(url: string) { return url.replace('/upload/', '/upload/w_300,h_300,c_fill,q_auto,f_auto/') }
function to12h(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')}${ampm}`
}

interface PanelState {
  date: string
  entry: ContentPlan | null
  content_type: ContentType
  platforms: string[]
  scheduled_time: string
  caption: string
  client_comments: string
  media_items: MediaItem[]
  status: ContentPlanStatus
  uploading: boolean
}

function entryMediaItems(entry: ContentPlan | null): MediaItem[] {
  if (!entry) return []
  if (entry.media_items?.length) return entry.media_items
  if (entry.media_url) return [{ url: entry.media_url, type: entry.media_type ?? 'image' }]
  return []
}

function makePanel(date: string, entry: ContentPlan | null): PanelState {
  return {
    date, entry,
    content_type: entry?.content_type ?? 'post',
    platforms: entry?.platforms ?? [],
    scheduled_time: entry?.scheduled_time ?? '',
    caption: entry?.caption ?? '',
    client_comments: entry?.client_comments ?? '',
    media_items: entryMediaItems(entry),
    status: entry?.status ?? 'scheduled',
    uploading: false,
  }
}

export function ContentPlannerCalendar({
  entries: initialEntries,
  month, year, clientId, basePath, isAdmin,
}: {
  entries: ContentPlan[]
  month: number
  year: number
  clientId: string
  basePath: string
  isAdmin: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [entryMap, setEntryMap] = useState<Record<string, ContentPlan>>(() => {
    const m: Record<string, ContentPlan> = {}
    for (const e of initialEntries) m[e.date] = e
    return m
  })
  const [panel, setPanel] = useState<PanelState | null>(null)
  const [viewMedia, setViewMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [carouselIdx, setCarouselIdx] = useState<Record<string, number>>({})
  const [commentEditing, setCommentEditing] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentSaving, setCommentSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const captionRef = useRef<HTMLTextAreaElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)
  const weeks = getWeeks(year, month)

  async function saveComment(ds: string, value: string) {
    const entry = entryMap[ds]
    if (!entry) return
    setCommentSaving(true)
    try {
      await updateContentPlan(entry.id, { client_comments: value.trim() || null })
      setEntryMap(prev => ({ ...prev, [ds]: { ...prev[ds], client_comments: value.trim() || null } }))
    } finally {
      setCommentSaving(false)
      setCommentEditing(null)
    }
  }

  // Close emoji picker on outside click
  useEffect(() => {
    if (!emojiOpen) return
    function handler(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [emojiOpen])

  function insertEmoji(emoji: string) {
    const ta = captionRef.current
    if (!ta) {
      setPanel(s => s ? { ...s, caption: s.caption + emoji } : s)
      return
    }
    const start = ta.selectionStart ?? ta.value.length
    const end = ta.selectionEnd ?? ta.value.length
    const next = ta.value.slice(0, start) + emoji + ta.value.slice(end)
    setPanel(s => s ? { ...s, caption: next } : s)
    // Restore cursor after state update
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + emoji.length
      ta.focus()
    })
  }

  function navigate(dir: -1 | 1) {
    let m = month + dir, y = year
    if (m < 0) { m = 11; y-- }
    if (m > 11) { m = 0; y++ }
    const sep = basePath.includes('?') ? '&' : '?'
    router.push(`${basePath}${sep}month=${m}&year=${y}`)
  }

  function openPanel(date: string) { setPanel(makePanel(date, entryMap[date] ?? null)) }

  function togglePlatform(pid: string) {
    setPanel(s => {
      if (!s) return s
      const has = s.platforms.includes(pid)
      return { ...s, platforms: has ? s.platforms.filter(p => p !== pid) : [...s.platforms, pid] }
    })
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
    if (!files.length || !panel) return
    setPanel(s => s ? { ...s, uploading: true } : s)
    const uploaded: MediaItem[] = []
    try {
      for (const file of files) {
        const isVideo = file.type.startsWith('video/')
        const fd = new FormData()
        fd.append('file', file)
        fd.append('upload_preset', UPLOAD_PRESET)
        fd.append('quality', 'auto')
        const endpoint = isVideo
          ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`
          : `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
        const res = await fetch(endpoint, { method: 'POST', body: fd })
        const data = await res.json()
        if (data.secure_url) uploaded.push({ url: data.secure_url, type: isVideo ? 'video' : 'image' })
      }
      setPanel(s => s ? { ...s, media_items: [...s.media_items, ...uploaded], uploading: false } : s)
    } catch {
      setPanel(s => s ? { ...s, uploading: false } : s)
      setSaveError('Media upload failed. Please try again.')
      setTimeout(() => setSaveError(null), 5000)
    }
    e.target.value = ''
  }

  function handleSave() {
    if (!panel) return
    startTransition(async () => {
      const payload = {
        client_id: clientId,
        date: panel.date,
        content_type: panel.content_type,
        platforms: panel.platforms,
        scheduled_time: panel.scheduled_time || null,
        caption: panel.caption || null,
        ...(isAdmin ? { client_comments: panel.client_comments || null } : {}),
        media_items: panel.media_items,
        media_url: panel.media_items[0]?.url ?? null,
        media_type: panel.media_items[0]?.type ?? null,
        status: panel.status,
      }
      try {
        if (panel.entry) {
          await updateContentPlan(panel.entry.id, payload)
          const updated = { ...panel.entry!, ...payload }
          setEntryMap(prev => ({ ...prev, [panel.date]: updated }))
          setPanel(prev => prev ? { ...prev, entry: updated } : prev)
        } else {
          const created = await createContentPlan(payload)
          if (created) {
            const newEntry = created as ContentPlan
            setEntryMap(prev => ({ ...prev, [panel.date]: newEntry }))
            // Keep panel open in edit mode so freelancer can see "Send for Approval"
            setPanel(prev => prev ? { ...prev, entry: newEntry } : prev)
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Save failed'
        setSaveError(msg)
        setTimeout(() => setSaveError(null), 5000)
      }
    })
  }

  function handleDelete() {
    if (!panel?.entry) return
    const { date, entry } = panel
    startTransition(async () => {
      await deleteContentPlan(entry.id)
      setEntryMap(prev => { const n = { ...prev }; delete n[date]; return n })
      setPanel(null)
    })
  }

  function handleSubmitForApproval() {
    if (!panel?.entry) return
    startTransition(async () => {
      await submitForApproval(panel.entry!.id)
      const updated = { ...panel.entry!, approval_requested: true }
      setEntryMap(prev => ({ ...prev, [panel.date]: updated }))
      setPanel(s => s ? { ...s, entry: updated } : s)
    })
  }

  function handleApproveCaption(entry: ContentPlan) {
    const next = !entry.caption_approved
    startTransition(async () => {
      await approveCaption(entry.id, next)
      const patch = { caption_approved: next, caption_rejected: false }
      setEntryMap(prev => prev[entry.date] ? { ...prev, [entry.date]: { ...prev[entry.date], ...patch } } : prev)
      setPanel(s => s && s.entry?.id === entry.id ? { ...s, entry: { ...s.entry!, ...patch } } : s)
    })
  }

  function handleApprovePost(entry: ContentPlan) {
    const next = !entry.post_approved
    startTransition(async () => {
      await approvePost(entry.id, next)
      const patch = { post_approved: next, post_rejected: false }
      setEntryMap(prev => prev[entry.date] ? { ...prev, [entry.date]: { ...prev[entry.date], ...patch } } : prev)
      setPanel(s => s && s.entry?.id === entry.id ? { ...s, entry: { ...s.entry!, ...patch } } : s)
    })
  }

  // ── Approval status label for a given entry ────────────────────────────
  function ApprovalBadge({ entry }: { entry: ContentPlan }) {
    if (entry.caption_rejected || entry.post_rejected) {
      const parts = []
      if (entry.caption_rejected) parts.push('Caption')
      if (entry.post_rejected) parts.push('Post')
      return <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200">✕ {parts.join(' & ')} Rejected</span>
    }
    if (entry.caption_approved && entry.post_approved) {
      return <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">✓ Fully Approved</span>
    }
    if (entry.caption_approved) {
      return <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">✓ Caption Approved</span>
    }
    if (entry.post_approved) {
      return <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">✓ Post Approved</span>
    }
    if (entry.approval_requested) {
      return <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">Under Review</span>
    }
    return null
  }

  return (
    <div className="flex gap-5 relative">
      <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelect} />

      {/* ── Calendar ── */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-semibold text-foreground">{MONTH_NAMES[month]} {year}</span>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full border-collapse" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th className="border-b border-r border-border px-2 py-2.5 text-left text-[10px] font-medium text-muted-foreground w-10" />
                {DAY_NAMES.map(d => (
                  <th key={d} className="border-b border-r border-border px-2 py-2.5 text-center text-[11px] font-semibold text-muted-foreground last:border-r-0">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wi) => {
                if (!week.some(d => d.getMonth() === month)) return null
                return (
                  <tr key={wi} className="align-top">
                    {/* Week label */}
                    <td className="border-b border-r border-border px-2 py-2 text-[10px] text-muted-foreground/60 font-medium">
                      W{wi + 1}
                    </td>
                    {week.map(day => {
                      const ds = toDS(day)
                      const inMonth = day.getMonth() === month
                      const entry = entryMap[ds] ?? null
                      const active = panel?.date === ds
                      const dotColor = entry ? STATUS_DOT[entry.status] : null

                      return (
                        <td
                          key={ds}
                          className={`border-b border-r border-border last:border-r-0 p-1.5 align-top transition-colors ${!inMonth ? 'bg-muted/20' : ''}`}
                          style={{ minWidth: 108, width: '14.28%' }}
                        >
                          {/* Date + add button */}
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[11px] font-semibold tabular-nums ${active ? 'text-[#f24a49]' : inMonth ? 'text-foreground' : 'text-muted-foreground/30'}`}>
                              {day.getDate()}
                            </span>
                            {inMonth && (
                              <button onClick={() => openPanel(ds)}
                                className="opacity-0 hover:opacity-100 group-hover:opacity-100 w-4 h-4 rounded flex items-center justify-center text-muted-foreground/40 hover:text-[#f24a49] transition-all"
                                style={{ opacity: active ? 1 : undefined }}>
                                <Plus className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {inMonth && entry && (
                            <div className="space-y-1">
                              {/* Main content card */}
                              <button
                                onClick={() => openPanel(ds)}
                                className={`w-full text-left rounded-lg overflow-hidden transition-all ${active ? 'ring-1 ring-[#f24a49]' : 'hover:ring-1 hover:ring-border'}`}
                                style={{ border: '1px solid var(--border)' }}
                              >
                                {/* Media carousel */}
                                {(() => {
                                  const items = entryMediaItems(entry)
                                  if (!items.length) {
                                    return (
                                      <div className="w-full bg-muted flex items-center justify-center" style={{ height: 110 }}>
                                        <ImageIcon className="w-6 h-6 text-muted-foreground/20" />
                                      </div>
                                    )
                                  }
                                  const idx = Math.min(carouselIdx[ds] ?? 0, items.length - 1)
                                  const item = items[idx]
                                  return (
                                    <div className="relative group w-full bg-muted overflow-hidden" style={{ height: 110 }}>
                                      {item.type === 'video'
                                        ? <video src={item.url} className="w-full h-full object-cover" muted />
                                        : <img src={thumbUrl(item.url)} alt="" className="w-full h-full object-cover" />}

                                      {/* Eye preview */}
                                      <button
                                        onClick={e => { e.stopPropagation(); setViewMedia({ url: item.url, type: item.type }) }}
                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Eye className="w-4 h-4 text-white drop-shadow" />
                                      </button>

                                      {/* Prev/Next arrows */}
                                      {items.length > 1 && (
                                        <>
                                          <button
                                            onClick={e => { e.stopPropagation(); setCarouselIdx(p => ({ ...p, [ds]: (idx - 1 + items.length) % items.length })) }}
                                            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                          >
                                            <ChevronLeft className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={e => { e.stopPropagation(); setCarouselIdx(p => ({ ...p, [ds]: (idx + 1) % items.length })) }}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                          >
                                            <ChevronRight className="w-3 h-3" />
                                          </button>
                                          {/* Dots */}
                                          <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1 z-10">
                                            {items.map((_, i) => (
                                              <button
                                                key={i}
                                                onClick={e => { e.stopPropagation(); setCarouselIdx(p => ({ ...p, [ds]: i })) }}
                                                className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white' : 'bg-white/40'}`}
                                              />
                                            ))}
                                          </div>
                                        </>
                                      )}

                                      {/* Count badge */}
                                      {items.length > 1 && (
                                        <div className="absolute top-1.5 right-1.5 bg-black/50 rounded-full px-1.5 py-0.5 text-[9px] text-white font-semibold z-10">
                                          {idx + 1}/{items.length}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })()}

                                {/* Card body */}
                                <div className="p-2 space-y-1.5 bg-background">
                                  {entry.platforms?.length > 0 && (
                                    <div className="flex gap-1.5 items-center">
                                      {entry.platforms.map(pid => {
                                        const p = PLATFORMS.find(x => x.id === pid)
                                        if (!p) return null
                                        return (
                                          <span key={pid} className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                                            {p.icon(16)}
                                          </span>
                                        )
                                      })}
                                      {entry.scheduled_time && (
                                        <span className="text-sm font-semibold text-foreground ml-auto tabular-nums">{to12h(entry.scheduled_time)}</span>
                                      )}
                                    </div>
                                  )}
                                  {!entry.platforms?.length && entry.scheduled_time && (
                                    <p className="text-sm font-semibold text-foreground tabular-nums">{to12h(entry.scheduled_time)}</p>
                                  )}
                                  <div>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                      style={{ backgroundColor: TYPE_BG[entry.content_type], color: TYPE_COLORS[entry.content_type] }}>
                                      {TYPE_LABELS[entry.content_type]}
                                    </span>
                                  </div>
                                  {entry.caption && (
                                    <p className="text-sm leading-snug text-foreground/80 line-clamp-3">{entry.caption}</p>
                                  )}
                                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                                      <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: dotColor! }} />
                                      {STATUS_LABELS[entry.status]}
                                    </span>
                                    <ApprovalBadge entry={entry} />
                                  </div>
                                </div>
                              </button>

                              {/* Client comments — inline editable for admin, read-only for freelancer */}
                              {isAdmin ? (
                                commentEditing === ds ? (
                                  <div className="relative" onClick={e => e.stopPropagation()}>
                                    <textarea
                                      autoFocus
                                      rows={3}
                                      value={commentDraft}
                                      onChange={e => setCommentDraft(e.target.value)}
                                      onBlur={() => saveComment(ds, commentDraft)}
                                      onKeyDown={e => { if (e.key === 'Escape') { setCommentEditing(null) } }}
                                      placeholder="Leave a comment for the freelancer…"
                                      className="w-full text-[10px] rounded-lg px-2.5 py-2 resize-none leading-snug focus:outline-none focus:ring-1 focus:ring-[#f24a49]"
                                      style={{ backgroundColor: 'rgba(120,120,128,0.15)', border: '1px solid rgba(120,120,128,0.3)' }}
                                    />
                                    {commentSaving && (
                                      <Loader2 className="absolute bottom-2 right-2 w-3 h-3 animate-spin text-muted-foreground" />
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={e => { e.stopPropagation(); setCommentDraft(entry.client_comments ?? ''); setCommentEditing(ds) }}
                                    className="w-full text-left rounded-lg px-2.5 py-2 transition-colors hover:brightness-95"
                                    style={{ backgroundColor: 'rgba(120,120,128,0.15)', border: '1px solid rgba(120,120,128,0.12)' }}
                                  >
                                    {entry.client_comments ? (
                                      <p className="text-[10px] text-foreground/70 leading-snug line-clamp-3">{entry.client_comments}</p>
                                    ) : (
                                      <p className="text-[10px] italic leading-snug" style={{ color: 'rgba(120,120,128,0.5)' }}>
                                        Leave a comment for the freelancer…
                                      </p>
                                    )}
                                  </button>
                                )
                              ) : (
                                <div
                                  className="w-full text-left rounded-lg px-2.5 py-2"
                                  style={{ backgroundColor: 'rgba(120,120,128,0.15)', border: '1px solid rgba(120,120,128,0.12)' }}
                                >
                                  {entry.client_comments ? (
                                    <p className="text-[10px] text-foreground/70 leading-snug line-clamp-3">{entry.client_comments}</p>
                                  ) : (
                                    <p className="text-[10px] italic leading-snug" style={{ color: 'rgba(120,120,128,0.5)' }}>
                                      client comments about the post and caption
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Empty cell — show faint + on hover */}
                          {inMonth && !entry && (
                            <button onClick={() => openPanel(ds)}
                              className="w-full h-16 rounded-lg border border-dashed border-border/40 flex items-center justify-center text-muted-foreground/20 hover:text-muted-foreground/40 hover:border-border transition-all">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Right panel ── */}
      {panel && (
        <div className="w-68 shrink-0 rounded-xl border border-border bg-card flex flex-col sticky top-0 overflow-hidden" style={{ width: 268, maxHeight: 'calc(100vh - 130px)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div>
              <p className="text-xs font-semibold text-foreground">{panel.entry ? 'Edit' : 'Add'} Entry</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{panel.date}</p>
            </div>
            <button onClick={() => setPanel(null)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-4 space-y-5">

            {/* Platforms */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Platforms</p>
              <div className="flex gap-1.5">
                {PLATFORMS.map(p => {
                  const active = panel.platforms.includes(p.id)
                  return (
                    <button key={p.id} onClick={() => togglePlatform(p.id)}
                      title={p.label}
                      className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-lg border transition-all text-[11px] font-semibold"
                      style={active
                        ? { borderColor: p.color, backgroundColor: p.color + '15', color: p.color }
                        : { borderColor: '#e5e7eb', color: '#9ca3af' }}>
                      <span style={{ color: active ? p.color : '#9ca3af' }}>{p.icon(15)}</span>
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Content type */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Content Type</p>
              <div className="grid grid-cols-3 gap-1">
                {(['post','story','reel'] as ContentType[]).map(ct => {
                  const active = panel.content_type === ct
                  return (
                    <button key={ct} onClick={() => setPanel(s => s ? { ...s, content_type: ct } : s)}
                      className="py-1.5 rounded-lg border text-[10px] font-semibold transition-all"
                      style={active
                        ? { backgroundColor: TYPE_BG[ct], color: TYPE_COLORS[ct], borderColor: TYPE_COLORS[ct] + '80' }
                        : { borderColor: '#e5e7eb', color: '#9ca3af' }}>
                      {TYPE_LABELS[ct]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Time</p>
              <input type="time" value={panel.scheduled_time}
                onChange={e => setPanel(s => s ? { ...s, scheduled_time: e.target.value } : s)}
                className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-[#f24a49]" />
            </div>

            {/* Caption + emoji picker */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Caption</p>
                <div className="relative" ref={emojiRef}>
                  <button
                    type="button"
                    onClick={() => setEmojiOpen(o => !o)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                    title="Add emoji"
                  >
                    <Smile className="w-3.5 h-3.5" />
                  </button>
                  {emojiOpen && (
                    <div className="absolute right-0 bottom-7 z-30 bg-card border border-border rounded-xl shadow-xl p-2" style={{ width: 220 }}>
                      <div className="grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
                        {EMOJIS.map(em => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => insertEmoji(em)}
                            className="text-base w-7 h-7 flex items-center justify-center rounded hover:bg-muted transition-colors"
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <textarea
                ref={captionRef}
                rows={5}
                placeholder="Write the post caption…"
                value={panel.caption}
                onChange={e => setPanel(s => s ? { ...s, caption: e.target.value } : s)}
                className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-[#f24a49] resize-none leading-relaxed"
              />
            </div>

            {/* Client Comments — admin edits inline on card; freelancer sees read-only here if exists */}
            {!isAdmin && panel.client_comments ? (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Client Comments</p>
                <div className="rounded-lg px-3 py-2 text-xs text-foreground/70 leading-relaxed"
                  style={{ backgroundColor: 'rgba(120,120,128,0.1)', border: '1px solid rgba(120,120,128,0.15)' }}>
                  {panel.client_comments}
                </div>
              </div>
            ) : null}

            {/* Media */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Media</p>
              <div className="grid grid-cols-3 gap-1.5">
                {panel.media_items.map((item, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border group">
                    {item.type === 'video'
                      ? <video src={item.url} className="w-full h-full object-cover" muted />
                      : <img src={thumbUrl(item.url)} alt="" className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => setViewMedia({ url: item.url, type: item.type })}
                        className="p-1 text-white"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => setPanel(s => s ? { ...s, media_items: s.media_items.filter((_, j) => j !== i) } : s)}
                      className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
                {/* Add more / upload button */}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={panel.uploading}
                  className="aspect-square rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground hover:border-[#f24a49] transition-colors disabled:opacity-50"
                >
                  {panel.uploading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><Upload className="w-3.5 h-3.5" /><span className="text-[9px] font-medium">Add</span></>}
                </button>
              </div>
            </div>

            {/* Status */}
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Status</p>
              <div className="grid grid-cols-3 gap-1">
                {(['scheduled','posted','not_posted'] as ContentPlanStatus[]).map(st => {
                  const active = panel.status === st
                  return (
                    <button key={st} onClick={() => setPanel(s => s ? { ...s, status: st } : s)}
                      className="py-1.5 rounded-lg border text-[10px] font-medium transition-all leading-tight"
                      style={active
                        ? { backgroundColor: STATUS_DOT[st] + '18', color: STATUS_DOT[st], borderColor: STATUS_DOT[st] + '60' }
                        : { borderColor: '#e5e7eb', color: '#9ca3af' }}>
                      {STATUS_LABELS[st]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Approval section */}
            {panel.entry && (
              <div className="border-t border-border pt-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Approval</p>

                {/* Freelancer: show status + submit button */}
                {!isAdmin && (
                  <div className="space-y-2">
                    {/* Current approval status */}
                    <div className="rounded-lg bg-muted/50 px-3 py-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Caption</span>
                        {panel.entry.caption_approved
                          ? <span className="text-[10px] font-semibold text-green-600 flex items-center gap-0.5"><Check className="w-2.5 h-2.5" /> Approved</span>
                          : panel.entry.caption_rejected
                          ? <span className="text-[10px] font-semibold text-red-600">✕ Rejected</span>
                          : <span className="text-[10px] text-muted-foreground/50">Pending</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Post</span>
                        {panel.entry.post_approved
                          ? <span className="text-[10px] font-semibold text-green-600 flex items-center gap-0.5"><Check className="w-2.5 h-2.5" /> Approved</span>
                          : panel.entry.post_rejected
                          ? <span className="text-[10px] font-semibold text-red-600">✕ Rejected</span>
                          : <span className="text-[10px] text-muted-foreground/50">Pending</span>}
                      </div>
                    </div>

                    {/* Submit for review — show if nothing is rejected and not yet submitted */}
                    {!panel.entry.approval_requested && !panel.entry.caption_approved && !panel.entry.post_approved && !panel.entry.caption_rejected && !panel.entry.post_rejected ? (
                      <button onClick={handleSubmitForApproval} disabled={isPending}
                        className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50">
                        <Send className="w-3 h-3" />
                        Send for Approval
                      </button>
                    ) : panel.entry.approval_requested && !panel.entry.caption_approved && !panel.entry.post_approved && !panel.entry.caption_rejected && !panel.entry.post_rejected ? (
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg py-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Under Review
                      </div>
                    ) : (panel.entry.caption_rejected || panel.entry.post_rejected) ? (
                      <button onClick={handleSubmitForApproval} disabled={isPending}
                        className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50">
                        <Send className="w-3 h-3" />
                        Resubmit for Approval
                      </button>
                    ) : null}
                  </div>
                )}

                {/* Admin: approve buttons */}
                {isAdmin && (
                  <div className="flex flex-col gap-1">
                    <button onClick={() => handleApproveCaption(panel.entry!)} disabled={isPending}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left"
                      style={panel.entry.caption_approved
                        ? { backgroundColor: '#dcfce7', color: '#15803d', borderColor: '#86efac' }
                        : { borderColor: '#e5e7eb', color: '#6b7280' }}>
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      {panel.entry.caption_approved ? 'Caption Approved' : 'Approve Caption'}
                    </button>
                    <button onClick={() => handleApprovePost(panel.entry!)} disabled={isPending}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left"
                      style={panel.entry.post_approved
                        ? { backgroundColor: '#dcfce7', color: '#15803d', borderColor: '#86efac' }
                        : { borderColor: '#e5e7eb', color: '#6b7280' }}>
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      {panel.entry.post_approved ? 'Post Approved' : 'Approve Post'}
                    </button>
                    {panel.entry.approval_requested && (
                      <p className="text-[10px] text-amber-600 text-center mt-0.5">⚡ Freelancer submitted for review</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer actions */}
          {saveError && (
            <div className="px-4 py-2 bg-red-50 border-t border-red-200">
              <p className="text-[11px] text-red-600 font-medium">{saveError}</p>
            </div>
          )}
          <div className="px-4 py-3 border-t border-border flex gap-2 shrink-0">
            {panel.entry && (
              <button onClick={handleDelete} disabled={isPending}
                className="p-2 rounded-lg border border-border text-muted-foreground hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={handleSave} disabled={isPending || panel.uploading}
              className="flex-1 text-xs text-white py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{ backgroundColor: '#f24a49' }}>
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Media lightbox */}
      {viewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85" onClick={() => setViewMedia(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewMedia(null)} className="absolute -top-9 right-0 text-white/60 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            {viewMedia.type === 'video'
              ? <video src={viewMedia.url} className="w-full max-h-[80vh] rounded-xl object-contain" controls autoPlay />
              : <img src={viewMedia.url} alt="" className="w-full max-h-[80vh] rounded-xl object-contain" />}
          </div>
        </div>
      )}
    </div>
  )
}
