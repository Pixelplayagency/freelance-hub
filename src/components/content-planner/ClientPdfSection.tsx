'use client'

import { useRef, useState, useTransition } from 'react'
import { FileText, Upload, Trash2, Loader2 } from 'lucide-react'
import { uploadClientPdf, deleteClientPdf } from '@/lib/actions/upload.actions'

interface ClientPdfSectionProps {
  clientId: string
  pdfUrl: string | null
  hasPdf: boolean
  isAdmin: boolean
}

export function ClientPdfSection({ clientId, pdfUrl, hasPdf, isAdmin }: ClientPdfSectionProps) {
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed.')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      alert('PDF must be under 50 MB.')
      return
    }
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        await uploadClientPdf(reader.result as string, clientId)
      } catch (err) {
        console.error(err)
        alert('Upload failed. Please try again.')
      } finally {
        setUploading(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    }
    reader.readAsDataURL(file)
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteClientPdf(clientId)
    })
  }

  if (!hasPdf && !isAdmin) return null

  return (
    <div className="flex items-center gap-1.5">
      {hasPdf && pdfUrl ? (
        <>
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground bg-background border border-border hover:bg-muted transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
            Content Plan PDF
          </a>
          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-all border border-transparent hover:border-border"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </>
      ) : isAdmin ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground border border-dashed border-border hover:border-foreground hover:text-foreground transition-all"
          >
            {uploading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Upload className="w-3.5 h-3.5" />
            }
            {uploading ? 'Uploading…' : 'Upload PDF'}
          </button>
        </>
      ) : null}
    </div>
  )
}
