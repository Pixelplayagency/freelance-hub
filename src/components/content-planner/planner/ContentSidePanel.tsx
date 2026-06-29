'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useRef, useState, useEffect } from 'react'
import {
  X, Upload, Loader2, Eye, Trash2, Send, Check, CheckCircle2, Smile,
  Calendar as CalendarIcon, Clock, ImageIcon, Film, Crop, Square, RectangleVertical, Smartphone,
} from 'lucide-react'
import type { ContentPlanStatus, ContentType, MediaItem } from '@/lib/types/app.types'
import { PlatformIcon } from './PlatformIcon'
import { thumbUrl, to12h, PLATFORMS, CONTENT_TYPE_META, type PanelDraft } from './types'

const EMOJIS = [
  '😀','😂','😍','🥰','😎','🤩','😜','🥺','😭','🤔','🙄','🥳','🤗','😴','🫠','🥹',
  '❤️','🧡','💛','💚','💙','💜','💖','💯','👍','👏','🙌','💪','🤞','✌️','🫶','🙏',
  '🌟','⭐','🌙','☀️','🌈','🔥','❄️','🌊','🌸','🌻','🍀','🦋','✨','💫','⚡','🎉',
  '🍕','☕','🍷','🥂','🎂','📸','🎬','🏆','💰','🎁','💡','🚀','✈️','📣','🔑','🌐',
]

const STATUS_CFG: { key: ContentPlanStatus; label: string; color: string }[] = [
  { key: 'scheduled',  label: 'Scheduled',  color: '#2563eb' },
  { key: 'posted',     label: 'Published',  color: '#059669' },
  { key: 'not_posted', label: 'Pending',    color: '#f59e0b' },
]

const ASPECT_RATIOS = [
  { id: 'free',    label: 'Original', icon: ImageIcon,            ratio: null },
  { id: '1:1',     label: '1:1',      icon: Square,               ratio: '1:1' },
  { id: '4:5',     label: '4:5',      icon: RectangleVertical,    ratio: '4:5' },
  { id: '9:16',    label: '9:16',     icon: Smartphone,           ratio: '9:16' },
] as const

function cropUrl(url: string, ratio: string | null) {
  if (!ratio) return thumbUrl(url)
  const [w, h] = ratio.split(':').map(Number)
  return url.replace('/upload/', `/upload/ar_${w}:${h},c_fill,g_auto,q_auto,f_auto/`)
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = ['00', '15', '30', '45']

interface ContentSidePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  draft: PanelDraft | null
  onDraftChange: (next: PanelDraft) => void
  isAdmin: boolean
  isSaving: boolean
  saveError: string | null
  onSave: () => void
  onDelete: () => void
  onUploadMedia: (files: File[]) => Promise<void>
  onSubmitForApproval: () => void
  onApproveCaption: () => void
  onApprovePost: () => void
  onViewMedia: (item: MediaItem) => void
}

export function ContentSidePanel({
  open, onOpenChange, draft, onDraftChange, isAdmin, isSaving, saveError,
  onSave, onDelete, onUploadMedia, onSubmitForApproval, onApproveCaption, onApprovePost, onViewMedia,
}: ContentSidePanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const captionRef = useRef<HTMLTextAreaElement>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [activeRatio, setActiveRatio] = useState<string>('free')
  const [previewIdx, setPreviewIdx] = useState(0)

  useEffect(() => { if (!open) { setEmojiOpen(false); setPreviewIdx(0); setActiveRatio('free') } }, [open])

  if (!draft) return null

  const isEdit = !!draft.entry
  const entry = draft.entry
  const creatorName = entry?.creator?.full_name || entry?.creator?.username || ''
  const dateFull = new Date(draft.date + 'T00:00:00')
  const dateShort = dateFull.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })

  function patch<K extends keyof PanelDraft>(key: K, value: PanelDraft[K]) {
    onDraftChange({ ...draft!, [key]: value })
  }

  function togglePlatform(pid: string) {
    const has = draft!.platforms.includes(pid)
    patch('platforms', has ? draft!.platforms.filter(p => p !== pid) : [...draft!.platforms, pid])
  }

  function insertEmoji(emoji: string) {
    const ta = captionRef.current
    if (!ta) { patch('caption', draft!.caption + emoji); setEmojiOpen(false); return }
    const start = ta.selectionStart ?? ta.value.length
    const end = ta.selectionEnd ?? ta.value.length
    const next = ta.value.slice(0, start) + emoji + ta.value.slice(end)
    patch('caption', next)
    requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + emoji.length; ta.focus() })
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
    if (!files.length) return
    await onUploadMedia(files)
    e.target.value = ''
  }

  const hasMedia = draft.media_items.length > 0
  const currentMedia = draft.media_items[previewIdx] ?? draft.media_items[0]
  const currentRatio = ASPECT_RATIOS.find(r => r.id === activeRatio)?.ratio ?? null

  // Time picker helpers
  const timeParsed = draft.scheduled_time ? (() => {
    const [h, m] = draft.scheduled_time.split(':').map(Number)
    return { hour: h % 12 || 12, minute: m, ampm: (h >= 12 ? 'PM' : 'AM') as 'AM' | 'PM' }
  })() : null

  function setTime(hour: number, minute: number, ampm: 'AM' | 'PM') {
    let h24 = hour % 12
    if (ampm === 'PM') h24 += 12
    patch('scheduled_time', `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-[480px] bg-background shadow-2xl border-l border-border flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300"
        >
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelect} />

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0 bg-card">
            <DialogPrimitive.Title className="text-sm font-bold text-foreground">
              {isEdit ? 'Edit content' : 'New content'}
            </DialogPrimitive.Title>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-md">{dateShort}</span>
              <DialogPrimitive.Close className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="overflow-y-auto flex-1 min-h-0">

            {/* ▸ Media zone */}
            <div className="bg-card border-b border-border">
              {hasMedia ? (
                <div className="space-y-0">
                  {/* Big preview */}
                  <div className="relative bg-muted/60 flex items-center justify-center" style={{ minHeight: 220 }}>
                    {currentMedia?.type === 'video' ? (
                      <video src={currentMedia.url} className="max-h-[280px] w-full object-contain" muted playsInline />
                    ) : currentMedia ? (
                      <img src={cropUrl(currentMedia.url, currentRatio)} alt="" className="max-h-[280px] w-full object-contain" />
                    ) : null}
                    {/* Overlay controls */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button type="button" onClick={() => currentMedia && onViewMedia(currentMedia)}
                        className="w-7 h-7 rounded-lg bg-black/50 backdrop-blur text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => {
                        patch('media_items', draft.media_items.filter((_, j) => j !== previewIdx))
                        setPreviewIdx(0)
                      }}
                        className="w-7 h-7 rounded-lg bg-black/50 backdrop-blur text-white flex items-center justify-center hover:bg-red-600/80 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {/* Counter */}
                    {draft.media_items.length > 1 && (
                      <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur rounded-md px-2 py-0.5 text-[10px] text-white font-bold tabular-nums">
                        {previewIdx + 1} / {draft.media_items.length}
                      </div>
                    )}
                  </div>

                  {/* Aspect ratio bar */}
                  {currentMedia?.type !== 'video' && (
                    <div className="flex items-center gap-1 px-3 py-2 border-t border-border/50 bg-muted/30">
                      <Crop className="w-3 h-3 text-muted-foreground mr-1" />
                      {ASPECT_RATIOS.map(r => {
                        const active = activeRatio === r.id
                        const Icon = r.icon
                        return (
                          <button key={r.id} type="button" onClick={() => setActiveRatio(r.id)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all ${
                              active ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted'
                            }`}>
                            <Icon className="w-3 h-3" />
                            {r.label}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Thumbnails strip + add */}
                  <div className="flex items-center gap-1.5 px-3 py-2 border-t border-border/50 overflow-x-auto">
                    {draft.media_items.map((item, i) => (
                      <button key={i} type="button" onClick={() => setPreviewIdx(i)}
                        className={`w-11 h-11 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                          i === previewIdx ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}>
                        {item.type === 'video'
                          ? <video src={item.url} className="w-full h-full object-cover" muted />
                          : <img src={thumbUrl(item.url)} alt="" className="w-full h-full object-cover" />}
                      </button>
                    ))}
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={draft.uploading}
                      className="w-11 h-11 rounded-lg border-2 border-dashed border-border shrink-0 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all disabled:opacity-50">
                      {draft.uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ) : (
                /* Empty upload zone */
                <button type="button" onClick={() => fileRef.current?.click()} disabled={draft.uploading}
                  className="w-full flex flex-col items-center justify-center gap-3 py-12 px-6 text-muted-foreground hover:text-primary transition-all disabled:opacity-50 group">
                  <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-current flex items-center justify-center group-hover:scale-105 transition-transform">
                    {draft.uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">Drop files or click to upload</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Images & videos — any size, we'll handle cropping</p>
                  </div>
                </button>
              )}
            </div>

            {/* ▸ Form fields */}
            <div className="px-5 py-5 space-y-5">

              {/* Caption */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">Caption</label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground tabular-nums">{draft.caption.length}</span>
                    <button type="button" onClick={() => setEmojiOpen(o => !o)}
                      className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      <Smile className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <textarea ref={captionRef} rows={3} placeholder="Write your caption…" value={draft.caption}
                    onChange={e => patch('caption', e.target.value)}
                    className="w-full text-sm rounded-xl border border-border bg-card px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none leading-relaxed placeholder:text-muted-foreground/50" />
                  {emojiOpen && (
                    <div className="absolute right-0 top-full mt-1 z-10 bg-card border border-border rounded-xl shadow-xl p-2 w-64">
                      <div className="grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
                        {EMOJIS.map(em => (
                          <button type="button" key={em} onClick={() => { insertEmoji(em); setEmojiOpen(false) }}
                            className="text-base w-7 h-7 flex items-center justify-center rounded hover:bg-muted transition-colors">{em}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Platform + Type — side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Platform</label>
                  <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
                    {PLATFORMS.map(p => {
                      const active = draft.platforms.includes(p.id)
                      return (
                        <button key={p.id} type="button" onClick={() => togglePlatform(p.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-all ${
                            active ? 'bg-primary/[0.04] text-foreground' : 'text-muted-foreground hover:bg-muted/50'
                          }`}>
                          <PlatformIcon platform={p.id} size={15} />
                          <span className="flex-1 text-left">{p.label}</span>
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                            active ? 'border-primary bg-primary' : 'border-border'
                          }`}>
                            {active && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Content type</label>
                  <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
                    {(['post', 'reel', 'story'] as ContentType[]).map(ct => {
                      const active = draft.content_type === ct
                      const meta = CONTENT_TYPE_META[ct]
                      return (
                        <button key={ct} type="button" onClick={() => patch('content_type', ct)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-all ${
                            active ? 'text-foreground' : 'text-muted-foreground hover:bg-muted/50'
                          }`}
                          style={active ? { backgroundColor: meta.bgVar } : undefined}>
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: active ? meta.color : 'var(--border)' }} />
                          <span className="flex-1 text-left">{meta.label}</span>
                          {active && <Check className="w-3 h-3" style={{ color: meta.color }} />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Schedule — unified card */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Schedule</label>
                <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
                  <div className="flex items-center gap-2.5 px-3.5 py-3">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground flex-1">
                      {dateFull.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3.5 py-3">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    {!draft.scheduled_time ? (
                      <button type="button" onClick={() => setTime(9, 0, 'AM')}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        Add time
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-1">
                        <select value={timeParsed!.hour} onChange={e => setTime(parseInt(e.target.value), timeParsed!.minute, timeParsed!.ampm)}
                          className="w-14 h-8 rounded-md border border-border bg-background text-center text-xs font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                          {HOURS.map(h => <option key={h} value={h}>{String(h).padStart(2, '0')}</option>)}
                        </select>
                        <span className="text-sm font-semibold text-muted-foreground/40">:</span>
                        <select value={MINUTES.reduce((prev, curr) => Math.abs(parseInt(curr) - timeParsed!.minute) < Math.abs(parseInt(prev) - timeParsed!.minute) ? curr : prev)}
                          onChange={e => setTime(timeParsed!.hour, parseInt(e.target.value), timeParsed!.ampm)}
                          className="w-14 h-8 rounded-md border border-border bg-background text-center text-xs font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                          {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <div className="flex rounded-md overflow-hidden border border-border">
                          {(['AM', 'PM'] as const).map(p => (
                            <button key={p} type="button" onClick={() => setTime(timeParsed!.hour, timeParsed!.minute, p)}
                              className={`px-2 h-8 text-[10px] font-bold transition-all ${
                                timeParsed!.ampm === p ? 'bg-foreground text-background' : 'bg-background text-muted-foreground hover:bg-muted'
                              }`}>{p}</button>
                          ))}
                        </div>
                        <button type="button" onClick={() => patch('scheduled_time', '')}
                          className="ml-auto text-[10px] text-muted-foreground/60 hover:text-red-500 transition-colors font-medium">
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Publishing status */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Publishing status</label>
                <div className="rounded-xl border border-border bg-card overflow-hidden flex divide-x divide-border">
                  {STATUS_CFG.map(st => {
                    const active = draft.status === st.key
                    return (
                      <button key={st.key} type="button" onClick={() => patch('status', st.key)}
                        className={`flex-1 py-2.5 text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
                          active ? '' : 'text-muted-foreground hover:bg-muted/50'
                        }`}
                        style={active ? { backgroundColor: st.color + '10', color: st.color } : undefined}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: active ? st.color : 'var(--border)' }} />
                        {st.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Notes</label>
                {isAdmin ? (
                  <textarea rows={2} placeholder="Add a note…" value={draft.client_comments}
                    onChange={e => patch('client_comments', e.target.value)}
                    className="w-full text-sm rounded-xl border border-border bg-card px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none leading-relaxed placeholder:text-muted-foreground/40" />
                ) : draft.client_comments ? (
                  <div className="rounded-xl bg-card border border-border px-3.5 py-2.5 text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{draft.client_comments}</div>
                ) : (
                  <p className="text-[11px] text-muted-foreground/40 py-1">No notes added</p>
                )}
              </div>

              {/* Created by */}
              {isEdit && creatorName && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="w-6 h-6 rounded-full bg-primary/15 text-primary text-[9px] font-bold flex items-center justify-center shrink-0">
                    {creatorName.split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <span className="text-[11px] text-muted-foreground">Created by <span className="font-semibold text-foreground">{creatorName}</span></span>
                </div>
              )}

              {/* Approval */}
              {isEdit && entry && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="text-xs font-semibold text-foreground">Approval</label>
                  {!isAdmin && (
                    <div className="space-y-2">
                      <div className="rounded-xl bg-card border border-border divide-y divide-border overflow-hidden">
                        <ApprovalRow label="Caption" approved={entry.caption_approved} rejected={entry.caption_rejected} />
                        <ApprovalRow label="Post" approved={entry.post_approved} rejected={entry.post_rejected} />
                      </div>
                      {!entry.approval_requested && !entry.caption_approved && !entry.post_approved && !entry.caption_rejected && !entry.post_rejected ? (
                        <button type="button" onClick={onSubmitForApproval} disabled={isSaving}
                          className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50">
                          <Send className="w-3.5 h-3.5" /> Send for approval
                        </button>
                      ) : entry.approval_requested && !entry.caption_approved && !entry.post_approved && !entry.caption_rejected && !entry.post_rejected ? (
                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl py-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Awaiting review
                        </div>
                      ) : (entry.caption_rejected || entry.post_rejected) ? (
                        <button type="button" onClick={onSubmitForApproval} disabled={isSaving}
                          className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50">
                          <Send className="w-3.5 h-3.5" /> Resubmit
                        </button>
                      ) : null}
                    </div>
                  )}
                  {isAdmin && (
                    <div className="grid grid-cols-2 gap-1.5">
                      <button type="button" onClick={onApproveCaption} disabled={isSaving}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          entry.caption_approved ? 'bg-green-50 text-green-700 border-green-300' : 'border-border text-foreground hover:bg-muted'
                        }`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {entry.caption_approved ? 'Caption ✓' : 'Caption'}
                      </button>
                      <button type="button" onClick={onApprovePost} disabled={isSaving}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          entry.post_approved ? 'bg-green-50 text-green-700 border-green-300' : 'border-border text-foreground hover:bg-muted'
                        }`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {entry.post_approved ? 'Post ✓' : 'Post'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Error ── */}
          {saveError && (
            <div className="px-5 py-2 bg-red-50 border-t border-red-200 shrink-0">
              <p className="text-xs text-red-700 font-medium">{saveError}</p>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="px-5 py-3 border-t border-border flex items-center gap-2 shrink-0 bg-card">
            {isEdit && (
              <button type="button" onClick={onDelete} disabled={isSaving}
                className="w-10 h-10 rounded-xl border border-border text-muted-foreground hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors flex items-center justify-center" aria-label="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={() => onOpenChange(false)} disabled={isSaving}
              className="px-5 h-10 rounded-xl border border-border bg-background text-sm font-semibold text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="button" onClick={onSave} disabled={isSaving || draft.uploading}
              className="px-6 h-10 rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{ backgroundColor: 'var(--primary)' }}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Save' : 'Schedule'}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function ApprovalRow({ label, approved, rejected }: { label: string; approved: boolean; rejected: boolean }) {
  return (
    <div className="flex items-center justify-between px-3.5 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {approved
        ? <span className="text-[11px] font-semibold text-green-700 flex items-center gap-1"><Check className="w-3 h-3" /> Approved</span>
        : rejected
        ? <span className="text-[11px] font-semibold text-red-600">Rejected</span>
        : <span className="text-[11px] text-muted-foreground/50">Pending</span>}
    </div>
  )
}
