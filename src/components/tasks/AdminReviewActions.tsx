'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, RotateCcw, Send } from 'lucide-react'
import { setTaskStatus } from '@/lib/actions/task.actions'
import { rejectSubmittedFiles, getTaskSubmittedFiles, saveTaskReference } from '@/lib/actions/upload.actions'
import { SubmittedFilesGrid, type SubmittedFile } from './SubmittedFilesGrid'
import { toast } from 'sonner'

interface AdminReviewActionsProps {
  taskId: string
  assigneeName?: string | null
}

export function AdminReviewActions({ taskId, assigneeName }: AdminReviewActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'revision' | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [files, setFiles] = useState<SubmittedFile[]>([])
  const [showRevisionForm, setShowRevisionForm] = useState(false)
  const [revisionNote, setRevisionNote] = useState('')

  useEffect(() => {
    getTaskSubmittedFiles(taskId)
      .then(result => {
        setFiles(result as SubmittedFile[])
        setLoadState('loaded')
      })
      .catch(() => {
        setLoadState('error')
      })
  }, [taskId])

  async function handleApprove() {
    setLoading('approve')
    try {
      await setTaskStatus(taskId, 'completed')
      toast.success('Task approved and marked complete')
      router.refresh()
    } catch {
      toast.error('Failed to approve task')
      setLoading(null)
    }
  }

  async function handleRevision() {
    const note = revisionNote.trim()
    if (!note) return
    setLoading('revision')
    try {
      await saveTaskReference(taskId, {
        type: 'note',
        content: `Revision requested: ${note}`,
        title: note.slice(0, 60),
      })
      await rejectSubmittedFiles(taskId)
      await setTaskStatus(taskId, 'in_progress')
      toast.success('Sent back for revision')
      setShowRevisionForm(false)
      setRevisionNote('')
      router.refresh()
    } catch {
      toast.error('Failed to request revision')
      setLoading(null)
    }
  }

  const displayName = assigneeName ?? 'Freelancer'

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/15 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-amber-100 dark:border-amber-800/50 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Pending your review</span>
        <span className="ml-auto text-xs text-amber-600 dark:text-amber-400">{displayName} submitted work</span>
      </div>

      {/* Submitted work — auto-expanded */}
      <div className="mx-4 mt-3 rounded-lg border border-amber-200 dark:border-amber-800/40 bg-card overflow-hidden">
        {loadState === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading submitted files…
          </div>
        )}

        {loadState === 'error' && (
          <p className="text-xs text-red-400 text-center py-5">Failed to load submitted files.</p>
        )}

        {loadState === 'loaded' && <SubmittedFilesGrid files={files} />}
      </div>

      {/* Revision reason form */}
      {showRevisionForm && (
        <div className="mx-4 mt-3 p-3 rounded-lg border border-dashed border-amber-300 dark:border-amber-700 bg-card space-y-2">
          <label className="text-xs font-semibold text-foreground">
            What needs to change?
          </label>
          <textarea
            value={revisionNote}
            onChange={e => setRevisionNote(e.target.value)}
            placeholder="e.g. Logo is cut off, please use the 1080x1920 size for stories…"
            rows={3}
            autoFocus
            className="w-full text-sm text-foreground placeholder:text-muted-foreground bg-background border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-primary transition-colors"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRevision}
              disabled={loading !== null || !revisionNote.trim()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {loading === 'revision'
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Send className="w-3.5 h-3.5" />}
              Send revision
            </button>
            <button
              type="button"
              onClick={() => { setShowRevisionForm(false); setRevisionNote('') }}
              disabled={loading !== null}
              className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-4 py-3 flex items-center gap-3 mt-1">
        <button
          onClick={() => setShowRevisionForm(true)}
          disabled={loading !== null || showRevisionForm}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:border-border hover:bg-secondary transition-colors disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
          Needs revision
        </button>
        <button
          onClick={handleApprove}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          {loading === 'approve'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <CheckCircle2 className="w-4 h-4" />}
          Approve & Complete
        </button>
      </div>
    </div>
  )
}
