'use client'

import { useRef, useState } from 'react'
import { CheckCircle2, FileVideo, Link2, Loader2, Send, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import { compressImage, formatFileSize } from '@/lib/utils/compressImage'
import type { TaskStatus } from '@/lib/types/app.types'

const MAX_VIDEO_BYTES = 500 * 1024 * 1024 // 500 MB
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!

interface SubmitWorkSectionProps {
  taskId: string
  status: TaskStatus
}

export function SubmitWorkSection({ taskId, status }: SubmitWorkSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [finalLink, setFinalLink] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({})

  if (status === 'completed') {
    return (
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-green-50 border border-green-100">
        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-700">Task completed</p>
          <p className="text-xs text-green-600 mt-0.5">This task has been approved and marked complete.</p>
        </div>
      </div>
    )
  }

  if (submitted || status === 'review') {
    return (
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-amber-50 border border-amber-100">
        <Loader2 className="w-5 h-5 text-amber-500 shrink-0 animate-spin" />
        <div>
          <p className="text-sm font-semibold text-amber-700">Under review</p>
          <p className="text-xs text-amber-600 mt-0.5">Your work has been submitted. Waiting for admin approval.</p>
        </div>
      </div>
    )
  }

  async function handleFileSelect(files: FileList | null) {
    if (!files) return
    const all = Array.from(files)
    if (all.some(f => !f.type.startsWith('image/') && !f.type.startsWith('video/'))) {
      toast.error('Only images and videos supported')
    }
    const valid = all.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))

    const processed: File[] = []
    for (const f of valid) {
      if (f.type.startsWith('video/')) {
        if (f.size > MAX_VIDEO_BYTES) {
          toast.error(`${f.name} exceeds 500 MB limit`)
          continue
        }
        processed.push(f)
      } else {
        processed.push(await compressImage(f))
      }
    }
    setPendingFiles(prev => [...prev, ...processed])
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave() {
    setDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  async function uploadToCloudinary(file: File, index: number): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('upload_preset', UPLOAD_PRESET)

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(prev => ({ ...prev, [index]: Math.round(e.loaded / e.total * 100) }))
        }
      }
      xhr.onload = () => {
        if (xhr.status < 300) {
          const data = JSON.parse(xhr.responseText)
          resolve(data.secure_url)
        } else {
          let msg = `Upload failed (${xhr.status})`
          try { msg = JSON.parse(xhr.responseText)?.error?.message ?? msg } catch {}
          reject(new Error(msg))
        }
      }
      xhr.onerror = () => reject(new Error(`Network error uploading ${file.name}`))
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`)
      xhr.send(fd)
    })
  }

  async function handleSubmit() {
    if (pendingFiles.length === 0 && !finalLink.trim()) {
      toast.error('Please upload a file or add a link before submitting')
      return
    }
    setSubmitting(true)
    try {
      if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error('Cloudinary env vars missing — restart the dev server')
      }
      const urls: { type: 'image' | 'video'; url: string; name: string }[] = []
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i]
        const secure_url = await uploadToCloudinary(file, i)
        urls.push({
          type: file.type.startsWith('image/') ? 'image' : 'video',
          url: secure_url,
          name: file.name,
        })
      }

      const res = await fetch('/api/submit-work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, urls, link: finalLink.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Submission failed')

      toast.success('Submitted for review!')
      setSubmitted(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submission failed')
      setSubmitting(false)
      setUploadProgress({})
    }
  }

  const hasContent = pendingFiles.length > 0 || finalLink.trim().length > 0

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-muted border-b border-border flex items-center gap-2">
        <Send className="w-4 h-4" style={{ color: '#f24a49' }} />
        <span className="text-sm font-semibold text-foreground">
          Submit your work
          {pendingFiles.length > 0 && (
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              ({pendingFiles.length} {pendingFiles.length === 1 ? 'file' : 'files'})
            </span>
          )}
        </span>
      </div>

      <div className="p-4 space-y-3 bg-card">
        {/* Pending file previews */}
        {pendingFiles.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {pendingFiles.map((file, i) => (
              <div key={i} className="relative group">
                <div className="aspect-video rounded-lg overflow-hidden border border-border bg-muted relative">
                  {file.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground p-2">
                      <FileVideo className="w-5 h-5" />
                      <span className="text-[9px] text-center leading-tight text-muted-foreground line-clamp-2">{file.name}</span>
                    </div>
                  )}
                  {/* File size badge */}
                  <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded pointer-events-none">
                    {formatFileSize(file.size)}
                  </div>
                  {/* Remove button */}
                  {!submitting && (
                    <button
                      type="button"
                      onClick={() => setPendingFiles(p => p.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded-full bg-white/90 text-gray-500 hover:text-red-500 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {/* Upload progress bar */}
                {submitting && (
                  <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-150"
                      style={{ width: `${uploadProgress[i] ?? 0}%`, backgroundColor: '#f24a49' }}
                    />
                  </div>
                )}
                {submitting && uploadProgress[i] !== undefined && (
                  <p className="text-[9px] text-muted-foreground text-center mt-0.5">{uploadProgress[i]}%</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload zone with drag & drop */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={e => handleFileSelect(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={submitting}
          className={cn(
            'w-full border-2 border-dashed rounded-lg py-4 transition-colors disabled:opacity-50',
            dragOver
              ? 'border-[#f24a49] bg-[#f24a49]/10'
              : 'border-border hover:border-[#f24a49]/40 hover:bg-[#f24a49]/5'
          )}
        >
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <Upload className={cn('w-5 h-5', dragOver && 'text-[#f24a49]')} />
            <span className="text-xs font-medium">{dragOver ? 'Drop to add' : 'Upload final file'}</span>
            <span className="text-[10px]">Image or video · drag & drop or click</span>
          </div>
        </button>

        {/* Delivery link — always visible */}
        <div className="flex items-center gap-2">
          <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            type="url"
            placeholder="Delivery link (Drive, Dropbox…) optional"
            value={finalLink}
            onChange={e => setFinalLink(e.target.value)}
            disabled={submitting}
            className="flex-1 text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f24a49]/20 focus:border-[#f24a49] placeholder:text-muted-foreground bg-background text-foreground disabled:opacity-50"
          />
          {finalLink && (
            <button type="button" onClick={() => setFinalLink('')} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !hasContent}
          className={cn(
            'w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity',
            !hasContent ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'
          )}
          style={{ backgroundColor: '#f24a49' }}
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
          ) : (
            <><Send className="w-4 h-4" /> Send to Review</>
          )}
        </button>
      </div>
    </div>
  )
}
