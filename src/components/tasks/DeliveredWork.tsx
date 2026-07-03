'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { getTaskSubmittedFiles } from '@/lib/actions/upload.actions'
import { SubmittedFilesGrid, type SubmittedFile } from './SubmittedFilesGrid'

export function DeliveredWork({ taskId }: { taskId: string }) {
  const [loadState, setLoadState] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [files, setFiles] = useState<SubmittedFile[]>([])

  useEffect(() => {
    getTaskSubmittedFiles(taskId)
      .then(result => {
        setFiles(result as SubmittedFile[])
        setLoadState('loaded')
      })
      .catch(() => setLoadState('error'))
  }, [taskId])

  return (
    <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/15 overflow-hidden">
      <div className="px-4 py-3 border-b border-green-100 dark:border-green-800/50 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
        <span className="text-sm font-semibold text-green-800 dark:text-green-300">Delivered work</span>
        <span className="ml-auto text-xs text-green-600 dark:text-green-400">Approved &amp; completed</span>
      </div>

      <div className="mx-4 my-3 rounded-lg border border-green-200 dark:border-green-800/40 bg-card overflow-hidden">
        {loadState === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading delivered files…
          </div>
        )}
        {loadState === 'error' && (
          <p className="text-xs text-red-400 text-center py-5">Failed to load delivered files.</p>
        )}
        {loadState === 'loaded' && <SubmittedFilesGrid files={files} />}
      </div>
    </div>
  )
}
