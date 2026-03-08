'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Link2, Loader2, Send, Upload, X } from 'lucide-react'
import { getSignedUploadUrl, saveTaskReference } from '@/lib/actions/upload.actions'
import { setTaskStatus } from '@/lib/actions/task.actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import { compressImage, formatFileSize } from '@/lib/utils/compressImage'
import type { TaskStatus } from '@/lib/types/app.types'

const MAX_VIDEO_BYTES = 500 * 1024 * 1024 // 500 MB

interface SubmitWorkSectionProps {
  taskId: string
  status: TaskStatus
}

export function SubmitWorkSection({ taskId, status }: SubmitWorkSectionProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [finalLink, setFinalLink] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

  if (status === 'review') {
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

  async function handleSubmit() {
    if (pendingFiles.length === 0 && !finalLink.trim()) {
      toast.error('Please upload a file or add a link before submitting')
      return
    }
    setSubmitting(true)
    try {
      // Upload files
      for (const file of pendingFiles) {
        const { signedUrl, path } = await getSignedUploadUrl(taskId, file.name)
        const res = await fetch(signedUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        })
        if (!res.ok) throw new Error(`Failed to upload ${file.name}`)
        await saveTaskReference(taskId, {
          type: file.type.startsWith('image/') ? 'image' : 'video',
          storage_path: path,
          title: `[Final] ${file.name}`,
        })
      }
      // Save link
      if (finalLink.trim()) {
        await saveTaskReference(taskId, {
          type: 'link',
          url: finalLink.trim(),
          title: '[Final] Delivery link',
        })
      }
      // Change status to review
      await setTaskStatus(taskId, 'review')
      toast.success('Submitted for review!')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submission failed')
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <Send className="w-4 h-4" style={{ color: '#f24a49' }} />
        <span className="text-sm font-semibold text-gray-800">Submit your work</span>
      </div>

      <div className="p-4 space-y-3 bg-white">
        {/* Pending file previews */}
        {pendingFiles.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {pendingFiles.map((file, i) => (
              <div key={i} className="relative group aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                {file.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500 p-1 text-center leading-tight">{file.name}</div>
                )}
                {/* File size badge */}
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded pointer-events-none">
                  {formatFileSize(file.size)}
                </div>
                <button
                  type="button"
                  onClick={() => setPendingFiles(p => p.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded-full bg-white/90 text-gray-500 hover:text-red-500 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload zone */}
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
          className="w-full border-2 border-dashed border-gray-200 rounded-lg py-4 hover:border-[#f24a49]/40 hover:bg-[#fff3f3]/30 transition-colors"
        >
          <div className="flex flex-col items-center gap-1.5 text-gray-400">
            <Upload className="w-5 h-5" />
            <span className="text-xs font-medium">Upload final file</span>
            <span className="text-[10px]">Image or video</span>
          </div>
        </button>

        {/* Final link */}
        {showLinkInput ? (
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              value={finalLink}
              onChange={e => setFinalLink(e.target.value)}
              autoFocus
              className="flex-1 text-sm border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f24a49]/20 focus:border-[#f24a49]"
            />
            {finalLink && (
              <button type="button" onClick={() => { setFinalLink(''); setShowLinkInput(false) }}
                className="text-gray-400 hover:text-gray-600 px-1">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowLinkInput(true)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-slate-700 transition-colors"
          >
            <Link2 className="w-3.5 h-3.5" />
            Add a delivery link (Drive, Dropbox, etc.)
          </button>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || (pendingFiles.length === 0 && !finalLink.trim())}
          className={cn(
            'w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity',
            (pendingFiles.length === 0 && !finalLink.trim()) ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90'
          )}
          style={{ backgroundColor: '#f24a49' }}
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
          ) : (
            <><Send className="w-4 h-4" /> Send to Review</>
          )}
        </button>
      </div>
    </div>
  )
}
