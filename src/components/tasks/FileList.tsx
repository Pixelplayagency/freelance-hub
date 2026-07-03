'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, Trash2, Loader2, Download, FileText } from 'lucide-react'
import { getSignedUploadUrl, saveTaskReference, deleteTaskReference } from '@/lib/actions/upload.actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import type { TaskReference } from '@/lib/types/app.types'

const ACCEPT = '.pdf,.doc,.docx,.svg,.png,.jpg,.jpeg,.zip,.rar,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/svg+xml,image/png,image/jpeg,application/zip,application/x-zip-compressed,application/x-rar-compressed,application/vnd.rar'

interface FileListProps {
  taskId: string
  references: TaskReference[]
  isAdmin: boolean
}

export function FileList({ taskId, references, isAdmin }: FileListProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  async function loadSignedUrl(path: string, refId: string) {
    if (signedUrls[refId]) return
    const { getStoragePublicUrl } = await import('@/lib/actions/upload.actions')
    const url = await getStoragePublicUrl(path)
    if (url) setSignedUrls(prev => ({ ...prev, [refId]: url }))
  }

  useEffect(() => {
    references.forEach(ref => {
      if (ref.storage_path) loadSignedUrl(ref.storage_path, ref.id)
    })
  }, [references])

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const { signedUrl, path } = await getSignedUploadUrl(taskId, file.name)
      const res = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      })
      if (!res.ok) throw new Error('Upload failed')

      await saveTaskReference(taskId, {
        type: 'file',
        storage_path: path,
        title: file.name,
      })
      toast.success('File uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(refId: string) {
    try {
      await deleteTaskReference(refId, taskId)
      toast.success('File removed')
    } catch {
      toast.error('Failed to remove file')
    }
  }

  return (
    <div className="space-y-3">
      {references.length === 0 && (
        <p className="text-sm text-muted-foreground">No files attached yet.</p>
      )}

      <div className="space-y-2">
        {references.map(ref => (
          <div key={ref.id} className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-muted group">
            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm flex-1 truncate text-foreground">{ref.title ?? 'File'}</span>
            {signedUrls[ref.id] && (
              <a
                href={signedUrls[ref.id]}
                download={ref.title ?? 'file'}
                title="Download"
                className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-border bg-card hover:bg-secondary transition-colors shrink-0"
              >
                <Download className="w-3 h-3" />
                Download
              </a>
            )}
            {isAdmin && (
              <button
                onClick={() => handleDelete(ref.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-muted-foreground transition-opacity shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {isAdmin && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'w-full border-2 border-dashed border-border rounded-lg p-6 text-center transition-colors hover:border-primary/40 hover:bg-primary/5',
              uploading && 'opacity-60 cursor-not-allowed'
            )}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Uploading…</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="w-5 h-5" />
                <span className="text-sm">Click to upload file</span>
                <span className="text-xs">PDF, DOC, SVG, PNG, JPG, ZIP, RAR</span>
              </div>
            )}
          </button>
        </>
      )}
    </div>
  )
}
