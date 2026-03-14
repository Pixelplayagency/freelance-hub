'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, Trash2, Loader2, Eye, Download } from 'lucide-react'
import { getSignedUploadUrl, saveTaskReference, deleteTaskReference } from '@/lib/actions/upload.actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import type { TaskReference } from '@/lib/types/app.types'

interface ImageUploadProps {
  taskId: string
  references: TaskReference[]
  isAdmin: boolean
}

export function ImageUpload({ taskId, references, isAdmin }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({})

  async function loadSignedUrl(path: string, refId: string) {
    if (signedUrls[refId]) return
    const { getStoragePublicUrl } = await import('@/lib/actions/upload.actions')
    const url = await getStoragePublicUrl(path)
    if (url) setSignedUrls(prev => ({ ...prev, [refId]: url }))
  }

  // Load all signed URLs on mount so View/Download buttons render immediately
  useEffect(() => {
    references.forEach(ref => {
      if (ref.storage_path) loadSignedUrl(ref.storage_path, ref.id)
    })
  }, [references])

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported')
      return
    }
    setUploading(true)
    try {
      const { signedUrl, path } = await getSignedUploadUrl(taskId, file.name)

      const res = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      if (!res.ok) throw new Error('Upload failed')

      await saveTaskReference(taskId, {
        type: 'image',
        storage_path: path,
        title: file.name,
      })
      toast.success('Image uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(refId: string) {
    try {
      await deleteTaskReference(refId, taskId)
      toast.success('Image removed')
    } catch {
      toast.error('Failed to remove image')
    }
  }

  return (
    <div className="space-y-3">
      {references.length === 0 && (
        <p className="text-sm text-muted-foreground">No images attached yet.</p>
      )}

      {/* Image grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {references.map(ref => (
          <div
            key={ref.id}
            className="relative group rounded-lg overflow-hidden bg-muted border border-border"
          >
            {/* Image preview */}
            <div className="aspect-video relative">
              {signedUrls[ref.id] ? (
                <img
                  src={signedUrls[ref.id]}
                  alt={ref.title ?? 'Image'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">
                  {ref.title ?? 'Image'}
                </div>
              )}
              {isAdmin && (
                <button
                  onClick={() => handleDelete(ref.id)}
                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded bg-white/90 hover:bg-red-50 text-gray-500 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View / Download — visible to everyone */}
            {signedUrls[ref.id] && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 bg-muted border-t border-border">
                <span className="text-[10px] text-muted-foreground truncate flex-1">{ref.title ?? 'Image'}</span>
                <a
                  href={signedUrls[ref.id]}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View full size"
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-border bg-card hover:bg-secondary transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  View
                </a>
                <a
                  href={signedUrls[ref.id]}
                  download={ref.title ?? 'image'}
                  title="Download"
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-border bg-card hover:bg-secondary transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Save
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Upload zone — admin only */}
      {isAdmin && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'w-full border-2 border-dashed border-border rounded-lg p-6 text-center transition-colors hover:border-[#f24a49]/40 hover:bg-[#f24a49]/5',
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
                <span className="text-sm">Click to upload image</span>
                <span className="text-xs">PNG, JPG, GIF, WebP</span>
              </div>
            )}
          </button>
        </>
      )}
    </div>
  )
}
