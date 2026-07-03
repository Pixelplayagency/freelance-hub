'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { getRejectedFiles } from '@/lib/actions/upload.actions'
import { SubmittedFilesGrid, type SubmittedFile } from './SubmittedFilesGrid'

export function RejectedWork({ taskId }: { taskId: string }) {
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [files, setFiles] = useState<SubmittedFile[]>([])

  useEffect(() => {
    getRejectedFiles(taskId)
      .then(result => {
        setFiles(result as SubmittedFile[])
        setLoadState('loaded')
      })
      .catch(() => setLoadState('error'))
  }, [taskId])

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Work sent back for revision, newest first — kept here so it can be compared against the resubmission.
      </p>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {loadState === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading rejected files…
          </div>
        )}
        {loadState === 'error' && (
          <p className="text-xs text-red-400 text-center py-5">Failed to load rejected files.</p>
        )}
        {loadState === 'loaded' && <SubmittedFilesGrid files={files} />}
      </div>
    </div>
  )
}
