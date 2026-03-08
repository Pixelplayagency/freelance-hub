'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, ChevronDown, ChevronUp,
  ExternalLink, FileVideo, Loader2, Paperclip, RotateCcw,
} from 'lucide-react'
import { setTaskStatus } from '@/lib/actions/task.actions'
import { getStoragePublicUrl } from '@/lib/actions/upload.actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
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
  const [showWork, setShowWork] = useState(false)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  // Load signed URLs when panel is opened
  useEffect(() => {
    if (!showWork) return
    const storageRefs = submittedRefs.filter(r => r.storage_path && !signedUrls[r.id])
    if (storageRefs.length === 0) return

    let cancelled = false
    ;(async () => {
      const entries: [string, string][] = []
      for (const ref of storageRefs) {
        const url = await getStoragePublicUrl(ref.storage_path!)
        if (url) entries.push([ref.id, url])
      }
      if (!cancelled) setSignedUrls(prev => ({ ...prev, ...Object.fromEntries(entries) }))
    })()
    return () => { cancelled = true }
  }, [showWork, submittedRefs])

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
  const totalCount = submittedRefs.length
  const displayName = assigneeName ?? 'Freelancer'

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-amber-100 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-sm font-semibold text-amber-800">Pending your review</span>
        <span className="ml-auto text-xs text-amber-600">{displayName} submitted work</span>
      </div>

      {/* View submitted work toggle */}
      <div className="px-4 pt-3 pb-0">
        <button
          type="button"
          onClick={() => setShowWork(v => !v)}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors',
            showWork
              ? 'bg-amber-100 border-amber-300 text-amber-800'
              : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-100/60'
          )}
        >
          <Paperclip className="w-4 h-4 shrink-0" />
          <span>
            View submitted work
            {totalCount > 0 && (
              <span className="ml-1.5 text-xs font-normal opacity-70">
                ({totalCount} {totalCount === 1 ? 'file' : 'files'})
              </span>
            )}
          </span>
          {showWork
            ? <ChevronUp className="w-4 h-4 ml-auto" />
            : <ChevronDown className="w-4 h-4 ml-auto" />}
        </button>
      </div>

      {/* Submitted work panel */}
      {showWork && (
        <div className="mx-4 mt-2 mb-0 rounded-lg border border-amber-200 bg-white/80 overflow-hidden">
          {totalCount === 0 ? (
            <p className="text-xs text-gray-400 text-center py-5">
              No files or links were submitted yet.
            </p>
          ) : (
            <div className="p-3 space-y-3">
              {/* Images */}
              {images.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Images ({images.length})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {images.map(ref => (
                      <a
                        key={ref.id}
                        href={signedUrls[ref.id] ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group aspect-video rounded-lg overflow-hidden bg-amber-50 border border-amber-200 block"
                      >
                        {signedUrls[ref.id] ? (
                          <img
                            src={signedUrls[ref.id]}
                            alt={ref.title ?? 'Image'}
                            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity">
                          <ExternalLink className="w-4 h-4 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {videos.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Videos ({videos.length})
                  </p>
                  <div className="space-y-1.5">
                    {videos.map(ref => (
                      <div
                        key={ref.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-700"
                      >
                        <FileVideo className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate flex-1">
                          {ref.title?.replace('[Final] ', '') ?? 'Video file'}
                        </span>
                        {signedUrls[ref.id] && (
                          <a
                            href={signedUrls[ref.id]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-gray-400 hover:text-gray-700"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {links.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Links ({links.length})
                  </p>
                  <div className="space-y-1.5">
                    {links.map(ref => (
                      <a
                        key={ref.id}
                        href={ref.url ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-xs text-blue-600 hover:bg-gray-100 transition-colors group"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate group-hover:underline">{ref.url}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="px-4 py-3 flex items-center gap-3 mt-1">
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
