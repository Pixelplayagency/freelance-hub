'use client'

import { useRef, useState } from 'react'
import { Upload, Trash2, Loader2 } from 'lucide-react'
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
        <p className="text-sm text-gray-400">No images attached yet.</p>
      )}

      {/* Image grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {references.map(ref => (
          <div
            key={ref.id}
            className="relative group aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
            onMouseEnter={() => ref.storage_path && loadSignedUrl(ref.storage_path, ref.id)}
          >
            {signedUrls[ref.id] ? (
              <img
                src={signedUrls[ref.id]}
                alt={ref.title ?? 'Image'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
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
        ))}
      </div>

      {/* Upload zone */}
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
              'w-full border-2 border-dashed border-gray-200 rounded-lg p-6 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/30',
              uploading && 'opacity-60 cursor-not-allowed'
            )}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Uploading…</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
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
