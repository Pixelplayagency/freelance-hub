'use client'

import { useRef, useState, useTransition } from 'react'
import { FileText, Upload, Trash2, Loader2, Link2, ExternalLink, X, Check } from 'lucide-react'
import { uploadClientPdf, deleteClientPdf, saveClientLink, deleteClientLink } from '@/lib/actions/upload.actions'

interface ClientDocsSectionProps {
  clientId: string
  pdfUrl: string | null
  hasPdf: boolean
  hasLink: boolean
  linkUrl: string | null
  canEdit: boolean
}

export function ClientPdfSection({
  clientId,
  pdfUrl,
  hasPdf,
  hasLink,
  linkUrl,
  canEdit,
}: ClientDocsSectionProps) {
  const [pdfPending, startPdfTransition] = useTransition()
  const [linkPending, startLinkTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkValue, setLinkValue] = useState('')
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

  // ── Link ─────────────────────────────────────────────────────
  function handleSaveLink() {
    const trimmed = linkValue.trim()
    if (!trimmed) return
    startLinkTransition(async () => {
      try {
        await saveClientLink(clientId, trimmed)
        setShowLinkInput(false)
        setLinkValue('')
      } catch {
        alert('Invalid URL. Please enter a valid link.')
      }
    })
  }

  function handleDeleteLink() {
    startLinkTransition(async () => { await deleteClientLink(clientId) })
  }

  // Nothing to show for view-only users if nothing uploaded yet
  if (!canEdit && !hasPdf && !hasLink) return null

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

      {/* ── Link ── */}
      {hasLink && linkUrl ? (
        <div className="flex items-center gap-1">
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground bg-background border border-border hover:bg-muted transition-all max-w-[160px]"
          >
            <Link2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">Reference Link</span>
            <ExternalLink className="w-3 h-3 shrink-0 text-muted-foreground" />
          </a>
          {canEdit && (
            <button
              onClick={handleDeleteLink}
              disabled={linkPending}
              className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-all"
              title="Remove link"
            >
              {linkPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            </button>
          )}
        </div>
      ) : canEdit ? (
        showLinkInput ? (
          <div className="flex items-center gap-1">
            <input
              type="url"
              value={linkValue}
              onChange={e => setLinkValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveLink(); if (e.key === 'Escape') { setShowLinkInput(false); setLinkValue('') } }}
              placeholder="https://..."
              autoFocus
              className="h-7 px-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring w-44"
            />
            <button
              onClick={handleSaveLink}
              disabled={linkPending || !linkValue.trim()}
              className="w-6 h-6 flex items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all disabled:opacity-40"
            >
              {linkPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => { setShowLinkInput(false); setLinkValue('') }}
              className="w-6 h-6 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLinkInput(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground border border-dashed border-border hover:border-foreground hover:text-foreground transition-all"
          >
            <Link2 className="w-3.5 h-3.5" />
            Add link
          </button>
        )
      ) : null}
    </div>
  )
}
