'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Share2, Copy, Check, Loader2, Lock, Trash2, MessageSquare, Plus } from 'lucide-react'
import { createShareLink, revokeShareLink, getShareNotesForClient } from '@/lib/actions/content-share.actions'
import { formatRelative } from '@/lib/utils/date'
import type { ContentShareLink, ContentShareNote } from '@/lib/types/app.types'

function shareUrl(token: string) {
  return `${window.location.origin}/share/${token}`
}

export function ShareLinkManager({ clientId, initialLinks }: { clientId: string; initialLinks: ContentShareLink[] }) {
  const [open, setOpen] = useState(false)
  const [links, setLinks] = useState(initialLinks)
  const [notes, setNotes] = useState<ContentShareNote[] | null>(null)
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next && notes === null) {
      getShareNotesForClient(clientId).then(setNotes).catch(() => setNotes([]))
    }
  }

  async function handleCreate() {
    setCreating(true)
    try {
      const link = await createShareLink(clientId, password.trim() || null)
      setLinks(prev => [link, ...prev])
      setPassword('')
    } catch {
      alert('Failed to create share link')
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke(id: string) {
    setRevokingId(id)
    try {
      await revokeShareLink(id, clientId)
      setLinks(prev => prev.filter(l => l.id !== id))
    } catch {
      alert('Failed to revoke link')
    } finally {
      setRevokingId(null)
    }
  }

  function handleCopy(link: ContentShareLink) {
    navigator.clipboard.writeText(shareUrl(link.token))
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground border border-dashed border-border hover:border-foreground hover:text-foreground transition-all">
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share content calendar</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Create new link */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New link</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password (optional)"
                className="flex-1 h-9 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <button
                onClick={handleCreate}
                disabled={creating}
                className="shrink-0 h-9 px-3.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Generate
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              The client can view the calendar full-screen, without signing in or editing anything.
            </p>
          </div>

          {/* Existing links */}
          {links.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active links</p>
              <div className="space-y-2">
                {links.map(link => (
                  <div key={link.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {link.password && <Lock className="w-3 h-3 text-muted-foreground shrink-0" />}
                        <span className="text-xs font-medium text-foreground truncate">/share/{link.token.slice(0, 10)}…</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Created {formatRelative(link.created_at)}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(link)}
                      title="Copy link"
                      className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all shrink-0"
                    >
                      {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleRevoke(link.id)}
                      disabled={revokingId === link.id}
                      title="Revoke link"
                      className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-all shrink-0"
                    >
                      {revokingId === link.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes left by the client */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" /> Client notes
            </p>
            {notes === null ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : notes.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No notes left yet.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {notes.map(n => (
                  <div key={n.id} className="rounded-lg bg-muted/40 border border-border/60 px-3 py-2">
                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{n.author_name || 'Anonymous'} · {formatRelative(n.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
