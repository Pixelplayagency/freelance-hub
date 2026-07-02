'use client'

import { useRef, useState, useTransition } from 'react'
import { FileText, Upload, Trash2, Loader2 } from 'lucide-react'
import { uploadClientPdf, deleteClientPdf } from '@/lib/actions/content-plan.actions'
import { ShareLinkManager } from './ShareLinkManager'
import type { ContentShareLink } from '@/lib/types/app.types'

interface ClientDocsSectionProps {
  clientId: string
  pdfUrl: string | null
  hasPdf: boolean
  canEdit: boolean
  canShare: boolean
  shareLinks: ContentShareLink[]
}

export function ClientPdfSection({
  clientId,
  pdfUrl,
  hasPdf,
  canEdit,
  canShare,
  shareLinks,
}: ClientDocsSectionProps) {
  const [pdfPending, startPdfTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── PDF ──────────────────────────────────────────────────────
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
      } catch {
        alert('Upload failed. Please try again.')
      } finally {
        setUploading(false)
        if (inputRef.current) inputRef.current.value = ''
      }
    }
    reader.readAsDataURL(file)
  }

  function handleDeletePdf() {
    startPdfTransition(async () => { await deleteClientPdf(clientId) })
  }

  // Nothing to show for view-only users if nothing uploaded yet
  if (!canEdit && !canShare && !hasPdf) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">

      {/* ── PDF ── */}
      {hasPdf && pdfUrl ? (
        <div className="flex items-center gap-1">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground bg-background border border-border hover:bg-muted transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />
            Content PDF
          </a>
          {canEdit && (
            <button
              onClick={handleDeletePdf}
              disabled={pdfPending}
              className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-all"
              title="Remove PDF"
            >
              {pdfPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            </button>
          )}
        </div>
      ) : canEdit ? (
        <>
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileChange} />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground border border-dashed border-border hover:border-foreground hover:text-foreground transition-all"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? 'Uploading…' : 'Upload PDF'}
          </button>
        </>
      ) : null}

      {/* ── Share ── */}
      {canShare && <ShareLinkManager clientId={clientId} initialLinks={shareLinks} />}
    </div>
  )
}
