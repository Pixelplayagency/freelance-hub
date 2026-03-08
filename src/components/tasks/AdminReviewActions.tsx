'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ExternalLink, FileVideo, Loader2, RotateCcw } from 'lucide-react'
import { setTaskStatus } from '@/lib/actions/task.actions'
import { getStoragePublicUrl } from '@/lib/actions/upload.actions'
import { toast } from 'sonner'
import type { TaskReference } from '@/lib/types/app.types'

interface AdminReviewActionsProps {
  taskId: string
  assigneeName?: string | null
  submittedRefs?: TaskReference[]
}

export function AdminReviewActions({
  taskId,
  assigneeName,
  submittedRefs = [],
}: AdminReviewActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'revision' | null>(null)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  // Load signed URLs for all image/video refs upfront
  useEffect(() => {
    const storageRefs = submittedRefs.filter(r => r.storage_path)
    if (storageRefs.length === 0) return

    let cancelled = false
    ;(async () => {
      const entries: [string, string][] = []
      for (const ref of storageRefs) {
        const url = await getStoragePublicUrl(ref.storage_path!)
        if (url) entries.push([ref.id, url])
      }
      if (!cancelled) setSignedUrls(Object.fromEntries(entries))
    })()

    return () => { cancelled = true }
  }, [submittedRefs])

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
    setLoading('revision')
    try {
      await setTaskStatus(taskId, 'in_progress')
      toast.success('Sent back for revision')
      router.refresh()
    } catch {
      toast.error('Failed to request revision')
      setLoading(null)
    }
  }

  const images = submittedRefs.filter(r => r.type === 'image')
  const videos = submittedRefs.filter(r => r.type === 'video')
  const links  = submittedRefs.filter(r => r.type === 'link')
  const hasWork = submittedRefs.length > 0

  const displayName = assigneeName ?? 'Freelancer'

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-amber-100 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-sm font-semibold text-amber-800">Pending your review</span>
        <span className="ml-auto text-xs text-amber-600">{displayName} submitted work</span>
      </div>

      {/* Submitted work preview */}
      {hasWork && (
        <div className="px-4 py-3 border-b border-amber-100 space-y-3 bg-white/60">
          {/* Images */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map(ref => (
                <div
                  key={ref.id}
                  className="relative aspect-video rounded-lg overflow-hidden bg-amber-100/60 border border-amber-200"
                >
                  {signedUrls[ref.id] ? (
                    <img
                      src={signedUrls[ref.id]}
                      alt={ref.title ?? 'Submitted image'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Videos */}
          {videos.length > 0 && (
            <div className="space-y-1.5">
              {videos.map(ref => (
                <div
                  key={ref.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-100/50 border border-amber-200 text-xs text-amber-800"
                >
                  <FileVideo className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{ref.title?.replace('[Final] ', '') ?? 'Video file'}</span>
                  {signedUrls[ref.id] && (
                    <a
                      href={signedUrls[ref.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto shrink-0 text-amber-600 hover:text-amber-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Links */}
          {links.length > 0 && (
            <div className="space-y-1.5">
              {links.map(ref => (
                <a
                  key={ref.id}
                  href={ref.url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-100/50 border border-amber-200 text-xs text-amber-700 hover:bg-amber-100 transition-colors group"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate group-hover:underline">
                    {ref.url}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="px-4 py-3 flex items-center gap-3">
        <button
          onClick={handleRevision}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {loading === 'revision'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <RotateCcw className="w-4 h-4" />}
          Needs revision
        </button>
        <button
          onClick={handleApprove}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#f24a49' }}
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
