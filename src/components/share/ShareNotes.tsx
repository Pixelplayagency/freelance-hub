'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MessageSquarePlus, Send } from 'lucide-react'
import { submitShareNote } from '@/lib/actions/content-share.actions'
import { formatRelative } from '@/lib/utils/date'
import type { ContentShareNote } from '@/lib/types/app.types'

export function ShareNotes({ shareLinkId, notes }: { shareLinkId: string; notes: ContentShareNote[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    setError(null)
    try {
      await submitShareNote(shareLinkId, name, message)
      setMessage('')
      router.refresh()
    } catch {
      setError('Failed to send. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquarePlus className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Notes for the team</h2>
      </div>

      {notes.length > 0 && (
        <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
          {notes.map(n => (
            <div key={n.id} className="rounded-xl bg-muted/40 border border-border/60 px-3.5 py-2.5">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{n.message}</p>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {n.author_name || 'Anonymous'} · {formatRelative(n.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name (optional)"
          className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Leave a note or feedback…"
            rows={2}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="shrink-0 h-9 px-3.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Send
          </button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </form>
    </div>
  )
}
