'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, Download, ExternalLink, Eye, FileVideo, Loader2, RotateCcw,
} from 'lucide-react'
import { setTaskStatus } from '@/lib/actions/task.actions'
import { clearSubmittedFiles, getTaskSubmittedFiles } from '@/lib/actions/upload.actions'
import { toast } from 'sonner'

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

async function downloadFile(url: string, name: string) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
  } catch {
    window.open(url, '_blank')
  }
}

export function AdminReviewActions({ taskId, assigneeName }: AdminReviewActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'revision' | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [files, setFiles] = useState<SubmittedFile[]>([])
  const [downloading, setDownloading] = useState<string | null>(null)

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
    setLoading('revision')
    try {
      await clearSubmittedFiles(taskId)
      await setTaskStatus(taskId, 'in_progress')
      toast.success('Sent back for revision')
      router.refresh()
    } catch {
      toast.error('Failed to request revision')
      setLoading(null)
    }
  }

  async function handleDownload(url: string, name: string) {
    setDownloading(url)
    await downloadFile(url, name)
    setDownloading(null)
  }

  const media = files.filter(f => f.ref.type === 'image' || f.ref.type === 'video')
  const links = files.filter(f => f.ref.type === 'link')
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

        {loadState === 'loaded' && files.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-5">No files or links were submitted yet.</p>
        )}

        {loadState === 'loaded' && files.length > 0 && (
          <div className="p-3 space-y-4">

            {/* Media grid */}
            {media.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Files ({media.length})
                </p>
                <div className={media.length === 1 ? 'flex flex-col gap-2' : 'grid grid-cols-2 gap-3'}>
                  {media.map(({ ref, signedUrl }) => {
                    const isVideo = ref.type === 'video'
                    const label = ref.title?.replace('[Final] ', '') ?? (isVideo ? 'Video' : 'Image')
                    const fileUrl = signedUrl ?? ref.url

                    return (
                      <div key={ref.id} className="rounded-lg overflow-hidden border border-border bg-gray-900">
                        {/* Media preview */}
                        <div style={{ aspectRatio: '16/9' }} className="relative">
                          {isVideo ? (
                            fileUrl ? (
                              <video
                                src={fileUrl}
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
                            fileUrl ? (
                              <img src={fileUrl} alt={label} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground p-2 text-center bg-secondary">
                                {label}
                              </div>
                            )
                          )}

                          {/* Type badge */}
                          <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-medium pointer-events-none">
                            {isVideo ? 'VID' : 'IMG'}
                          </div>
                        </div>

                        {/* Always-visible action bar */}
                        {fileUrl && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-muted border-t border-border">
                            <span className="text-xs text-muted-foreground truncate flex-1">{label}</span>
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View full size"
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-card border border-border text-xs text-foreground hover:bg-secondary transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </a>
                            <button
                              type="button"
                              title="Download"
                              onClick={() => handleDownload(fileUrl, label)}
                              disabled={downloading === fileUrl}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-card border border-border text-xs text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                            >
                              {downloading === fileUrl
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Download className="w-3.5 h-3.5" />}
                              Download
                            </button>
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
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Delivery Links ({links.length})
                </p>
                <div className="space-y-1.5">
                  {links.map(({ ref }) => (
                    <a
                      key={ref.id}
                      href={ref.url ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted border border-border text-xs text-blue-500 hover:bg-secondary hover:border-border transition-colors group"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate flex-1 group-hover:underline">{ref.url}</span>
                      <span className="shrink-0 text-muted-foreground">Open →</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-4 py-3 flex items-center gap-3 mt-1">
        <button
          onClick={handleRevision}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:border-border hover:bg-secondary transition-colors disabled:opacity-50"
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
