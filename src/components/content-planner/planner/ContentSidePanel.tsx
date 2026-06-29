'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useRef, useState, useEffect } from 'react'
import {
  X, Upload, Loader2, Eye, Trash2, Send, Check, CheckCircle2, Smile, Calendar as CalendarIcon,
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

const STATUS_LABELS: Record<ContentPlanStatus, string> = { scheduled: 'Scheduled', posted: 'Published', not_posted: 'Pending' }
const STATUS_DOT: Record<ContentPlanStatus, string> = { scheduled: '#2563eb', posted: '#059669', not_posted: '#f59e0b' }

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

  useEffect(() => { if (!open) setEmojiOpen(false) }, [open])

  if (!draft) return null

  const isEdit = !!draft.entry
  const creatorName = draft.entry?.creator?.full_name || draft.entry?.creator?.username || 'Unassigned'
  const dateLabel = new Date(draft.date + 'T00:00:00').toLocaleDateString('default', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  function patch<K extends keyof PanelDraft>(key: K, value: PanelDraft[K]) {
    onDraftChange({ ...draft!, [key]: value })
  }

  function togglePlatform(pid: string) {
    if (!draft) return
    const has = draft.platforms.includes(pid)
    patch('platforms', has ? draft.platforms.filter(p => p !== pid) : [...draft.platforms, pid])
  }

  function insertEmoji(emoji: string) {
    const ta = captionRef.current
    if (!ta) { patch('caption', draft!.caption + emoji); setEmojiOpen(false); return }
    const start = ta.selectionStart ?? ta.value.length
    const end = ta.selectionEnd ?? ta.value.length
    const next = ta.value.slice(0, start) + emoji + ta.value.slice(end)
    patch('caption', next)
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + emoji.length
      ta.focus()
    })
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter(f =>
      f.type.startsWith('image/') || f.type.startsWith('video/')
    )
    if (!files.length) return
    await onUploadMedia(files)
    e.target.value = ''
  }

  const entry = draft.entry

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-[460px] bg-card shadow-2xl border-l border-border flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300"
        >
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelect} />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-base font-bold text-foreground leading-tight truncate">
                {isEdit ? 'Edit content' : 'New content'}
              </DialogPrimitive.Title>
              <div className="flex items-center gap-1.5 mt-0.5">
                <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">{dateLabel}</span>
              </div>
            </div>
            <DialogPrimitive.Close className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </DialogPrimitive.Close>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-5 py-5 space-y-6 min-h-0">
            {/* Media */}
            <Section title="Media">
              <div className="grid grid-cols-3 gap-2">
                {draft.media_items.map((item, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border group">
                    {item.type === 'video'
                      ? <video src={item.url} className="w-full h-full object-cover" muted />
                      : <img src={thumbUrl(item.url)} alt="" className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                      <button type="button" onClick={() => onViewMedia(item)}
                        className="w-7 h-7 rounded-full bg-white/95 text-foreground flex items-center justify-center hover:scale-110 transition-transform">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => patch('media_items', draft.media_items.filter((_, j) => j !== i))}
                        className="w-7 h-7 rounded-full bg-white/95 text-red-600 flex items-center justify-center hover:scale-110 transition-transform">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => fileRef.current?.click()} disabled={draft.uploading}
                  className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/[0.03] transition-all disabled:opacity-50">
                  {draft.uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-4 h-4" /><span className="text-[10px] font-medium">Upload</span></>}
                </button>
              </div>
            </Section>

            {/* Caption */}
            <Section title="Caption" actions={
              <button type="button" onClick={() => setEmojiOpen(o => !o)} className="text-muted-foreground hover:text-foreground transition-colors">
                <Smile className="w-3.5 h-3.5" />
              </button>
            }>
              <div className="relative">
                <textarea ref={captionRef} rows={4} placeholder="Write the post caption…" value={draft.caption}
                  onChange={e => patch('caption', e.target.value)}
                  className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none leading-relaxed" />
                {emojiOpen && (
                  <div className="absolute right-0 top-full mt-1 z-10 bg-card border border-border rounded-xl shadow-xl p-2 w-64">
                    <div className="grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
                      {EMOJIS.map(em => (
                        <button type="button" key={em} onClick={() => insertEmoji(em)}
                          className="text-base w-7 h-7 flex items-center justify-center rounded hover:bg-muted transition-colors">{em}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* Platforms */}
            <Section title="Platforms">
              <div className="grid grid-cols-3 gap-1.5">
                {PLATFORMS.map(p => {
                  const active = draft.platforms.includes(p.id)
                  return (
                    <button key={p.id} type="button" onClick={() => togglePlatform(p.id)}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-all"
                      style={active
                        ? { borderColor: p.color, backgroundColor: p.color + '12', color: p.color }
                        : { borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                      <PlatformIcon platform={p.id} size={14} />
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </Section>

            {/* Content type */}
            <Section title="Content type">
              <div className="grid grid-cols-3 gap-1.5">
                {(['post', 'reel', 'story'] as ContentType[]).map(ct => {
                  const active = draft.content_type === ct
                  const meta = CONTENT_TYPE_META[ct]
                  return (
                    <button key={ct} type="button" onClick={() => patch('content_type', ct)}
                      className="py-2 rounded-xl border text-xs font-semibold transition-all"
                      style={active
                        ? { borderColor: meta.color + '60', backgroundColor: meta.bgVar, color: meta.color }
                        : { borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                      {meta.label}
                    </button>
                  )
                })}
              </div>
            </Section>

            {/* Schedule */}
            <Section title="Schedule">
              <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground">Date</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      <input type="date" value={draft.date} readOnly
                        className="w-full text-sm rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-foreground tabular-nums cursor-default" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground">Time</label>
                    <div className="relative">
                      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <input type="time" value={draft.scheduled_time} onChange={e => patch('scheduled_time', e.target.value)}
                        className="w-full text-sm rounded-lg border border-border bg-background pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all tabular-nums" />
                    </div>
                  </div>
                </div>
                {draft.scheduled_time && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-primary/[0.06] border border-primary/15">
                    <CalendarIcon className="w-3 h-3 text-primary" />
                    <span className="text-xs font-semibold text-primary tabular-nums">
                      {new Date(draft.date + 'T00:00:00').toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })} at {to12h(draft.scheduled_time)}
                    </span>
                  </div>
                )}
              </div>
            </Section>

            {/* Publishing status */}
            <Section title="Publishing status">
              <div className="grid grid-cols-3 gap-1.5">
                {(['scheduled', 'posted', 'not_posted'] as ContentPlanStatus[]).map(st => {
                  const active = draft.status === st
                  return (
                    <button key={st} type="button" onClick={() => patch('status', st)}
                      className="py-2.5 rounded-xl border text-xs font-semibold transition-all flex flex-col items-center justify-center gap-1"
                      style={active
                        ? { borderColor: STATUS_DOT[st], backgroundColor: STATUS_DOT[st] + '12', color: STATUS_DOT[st], boxShadow: `0 0 0 1px ${STATUS_DOT[st]}30` }
                        : { borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                      <span className="w-2 h-2 rounded-full transition-all" style={{ backgroundColor: active ? STATUS_DOT[st] : 'var(--border)' }} />
                      {STATUS_LABELS[st]}
                    </button>
                  )
                })}
              </div>
            </Section>

            {/* Created by (read-only) */}
            {isEdit && entry?.creator && (
              <Section title="Created by">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted/30">
                  <div className="w-7 h-7 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                    {creatorName.split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{creatorName}</p>
                    {entry.creator.username && <p className="text-[10px] text-muted-foreground truncate">@{entry.creator.username}</p>}
                  </div>
                </div>
              </Section>
            )}

            {/* Notes */}
            <Section title="Notes & comments">
              {isAdmin ? (
                <textarea rows={3} placeholder="Leave a note for the team…" value={draft.client_comments}
                  onChange={e => patch('client_comments', e.target.value)}
                  className="w-full text-sm rounded-xl border border-border bg-background px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none leading-relaxed" />
              ) : draft.client_comments ? (
                <div className="rounded-xl bg-muted/40 border border-border px-3 py-2.5 text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{draft.client_comments}</div>
              ) : (
                <div className="rounded-xl bg-muted/20 border border-dashed border-border px-3 py-3 text-xs text-muted-foreground/60 italic text-center">No notes yet</div>
              )}
            </Section>

            {/* Approval */}
            {isEdit && entry && (
              <Section title="Approval">
                {!isAdmin && (
                  <div className="space-y-2">
                    <div className="rounded-xl bg-muted/30 border border-border px-3 py-2.5 space-y-1.5">
                      <ApprovalRow label="Caption" approved={entry.caption_approved} rejected={entry.caption_rejected} />
                      <ApprovalRow label="Post" approved={entry.post_approved} rejected={entry.post_rejected} />
                    </div>
                    {!entry.approval_requested && !entry.caption_approved && !entry.post_approved && !entry.caption_rejected && !entry.post_rejected ? (
                      <button type="button" onClick={onSubmitForApproval} disabled={isSaving}
                        className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50">
                        <Send className="w-3.5 h-3.5" /> Send for approval
                      </button>
                    ) : entry.approval_requested && !entry.caption_approved && !entry.post_approved && !entry.caption_rejected && !entry.post_rejected ? (
                      <div className="flex items-center justify-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl py-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Awaiting admin review
                      </div>
                    ) : (entry.caption_rejected || entry.post_rejected) ? (
                      <button type="button" onClick={onSubmitForApproval} disabled={isSaving}
                        className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50">
                        <Send className="w-3.5 h-3.5" /> Resubmit for approval
                      </button>
                    ) : null}
                  </div>
                )}
                {isAdmin && (
                  <div className="space-y-1.5">
                    <button type="button" onClick={onApproveCaption} disabled={isSaving}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all text-left"
                      style={entry.caption_approved
                        ? { backgroundColor: '#dcfce7', color: '#15803d', borderColor: '#86efac' }
                        : { borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      {entry.caption_approved ? 'Caption approved' : 'Approve caption'}
                    </button>
                    <button type="button" onClick={onApprovePost} disabled={isSaving}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all text-left"
                      style={entry.post_approved
                        ? { backgroundColor: '#dcfce7', color: '#15803d', borderColor: '#86efac' }
                        : { borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      {entry.post_approved ? 'Post approved' : 'Approve post'}
                    </button>
                    {entry.approval_requested && <p className="text-[10px] text-amber-600 text-center pt-1">Submitted for review</p>}
                  </div>
                )}
              </Section>
            )}
          </div>

          {/* Error */}
          {saveError && (
            <div className="px-5 py-2 bg-red-50 border-t border-red-200 shrink-0">
              <p className="text-xs text-red-700 font-medium">{saveError}</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border flex items-center gap-2 shrink-0 bg-card">
            {isEdit && (
              <button type="button" onClick={onDelete} disabled={isSaving}
                className="w-10 h-10 rounded-xl border border-border text-muted-foreground hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center" aria-label="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button type="button" onClick={() => onOpenChange(false)} disabled={isSaving}
              className="flex-1 h-10 rounded-xl border border-border bg-background text-sm font-semibold text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="button" onClick={onSave} disabled={isSaving || draft.uploading}
              className="flex-1 h-10 rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{ backgroundColor: 'var(--primary)' }}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? 'Save changes' : 'Schedule'}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function Section({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
        {actions}
      </div>
      {children}
    </div>
  )
}

function ApprovalRow({ label, approved, rejected }: { label: string; approved: boolean; rejected: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      {approved
        ? <span className="text-[11px] font-semibold text-green-700 flex items-center gap-0.5"><Check className="w-3 h-3" /> Approved</span>
        : rejected
        ? <span className="text-[11px] font-semibold text-red-600">Rejected</span>
        : <span className="text-[11px] text-muted-foreground/60">Pending</span>}
    </div>
  )
}
