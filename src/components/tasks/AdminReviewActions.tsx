'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, ChevronDown, ChevronUp,
  Download, ExternalLink, Eye, FileVideo, Loader2, Paperclip, RotateCcw,
} from 'lucide-react'
import { setTaskStatus } from '@/lib/actions/task.actions'
import { getTaskSubmittedFiles } from '@/lib/actions/upload.actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'

interface SubmittedFile {
  ref: {
    id: string
    type: string
    storage_path: string | null
    url: string | null
    title: string | null
  }
  signedUrl: string | null
}

interface AdminReviewActionsProps {
  taskId: string
  assigneeName?: string | null
}

export function AdminReviewActions({ taskId, assigneeName }: AdminReviewActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'revision' | null>(null)
  const [showWork, setShowWork] = useState(false)
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded'>('idle')
  const [files, setFiles] = useState<SubmittedFile[]>([])

  async function toggleWork() {
    if (!showWork && loadState === 'idle') {
      setShowWork(true)
      setLoadState('loading')
      try {
        const result = await getTaskSubmittedFiles(taskId)
        setFiles(result as SubmittedFile[])
        setLoadState('loaded')
      } catch {
        toast.error('Failed to load submitted files')
        setLoadState('idle')
        setShowWork(false)
      }
    } else {
      setShowWork(v => !v)
    }
  }

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

  const media = files.filter(f => f.ref.type === 'image' || f.ref.type === 'video')
  const links = files.filter(f => f.ref.type === 'link')
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
          onClick={toggleWork}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors',
            showWork
              ? 'bg-amber-100 border-amber-300 text-amber-800'
              : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-100/60'
          )}
        >
          <Paperclip className="w-4 h-4 shrink-0" />
          <span>View submitted work</span>
          {loadState === 'loading' && <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" />}
          {loadState === 'loaded' && files.length > 0 && (
            <span className="ml-1 text-xs font-normal opacity-70">
              ({files.length} {files.length === 1 ? 'item' : 'items'})
            </span>
          )}
          {showWork
            ? <ChevronUp className="w-4 h-4 ml-auto" />
            : <ChevronDown className="w-4 h-4 ml-auto" />}
        </button>
      </div>

      {/* Submitted work panel */}
      {showWork && loadState === 'loaded' && (
        <div className="mx-4 mt-2 rounded-lg border border-amber-200 bg-white/80 overflow-hidden">
          {files.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-5">
              No files or links were submitted yet.
            </p>
          ) : (
            <div className="p-3 space-y-4">

              {/* Media grid — images and videos in one grid */}
              {media.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Files ({media.length})
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {media.map(({ ref, signedUrl }) => {
                      const isVideo = ref.type === 'video'
                      const label = ref.title?.replace('[Final] ', '') ?? (isVideo ? 'Video' : 'Image')
                      return (
                        <div
                          key={ref.id}
                          className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-900"
                          style={{ aspectRatio: '16/9' }}
                        >
                          {isVideo ? (
                            signedUrl ? (
                              <video
                                src={signedUrl}
                                controls
                                preload="metadata"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                                <FileVideo className="w-6 h-6 text-gray-500" />
                                <span className="text-[10px] text-gray-400 px-2 text-center">{label}</span>
                              </div>
                            )
                          ) : (
                            signedUrl ? (
                              <img
                                src={signedUrl}
                                alt={label}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 p-2 text-center bg-gray-100">
                                {label}
                              </div>
                            )
                          )}

                          {/* Type badge */}
                          <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-medium pointer-events-none">
                            {isVideo ? 'VID' : 'IMG'}
                          </div>

                          {/* View + Download buttons — appear on hover */}
                          {signedUrl && (
                            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a
                                href={signedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View full size"
                                className="flex items-center justify-center w-7 h-7 rounded bg-black/60 hover:bg-black/80 transition-colors"
                                onClick={e => e.stopPropagation()}
                              >
                                <Eye className="w-3.5 h-3.5 text-white" />
                              </a>
                              <a
                                href={signedUrl}
                                download={label}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Download"
                                className="flex items-center justify-center w-7 h-7 rounded bg-black/60 hover:bg-black/80 transition-colors"
                                onClick={e => e.stopPropagation()}
                              >
                                <Download className="w-3.5 h-3.5 text-white" />
                              </a>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Delivery links */}
              {links.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Delivery Links ({links.length})
                  </p>
                  <div className="space-y-1.5">
                    {links.map(({ ref }) => (
                      <a
                        key={ref.id}
                        href={ref.url ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs text-blue-600 hover:bg-blue-50 hover:border-blue-100 transition-colors group"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate flex-1 group-hover:underline">{ref.url}</span>
                        <span className="shrink-0 text-gray-400">Open →</span>
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
