'use client'

import { useState } from 'react'
import { Download, ExternalLink, Eye, FileVideo, Loader2 } from 'lucide-react'

export interface SubmittedFile {
  ref: {
    id: string
    type: string
    storage_path: string | null
    url: string | null
    title: string | null
  }
  signedUrl: string | null
}

async function downloadFile(url: string, name: string) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
  } catch {
    window.open(url, '_blank')
  }
}

export function SubmittedFilesGrid({ files }: { files: SubmittedFile[] }) {
  const [downloading, setDownloading] = useState<string | null>(null)

  async function handleDownload(url: string, name: string) {
    setDownloading(url)
    await downloadFile(url, name)
    setDownloading(null)
  }

  const media = files.filter(f => f.ref.type === 'image' || f.ref.type === 'video')
  const links = files.filter(f => f.ref.type === 'link')

  if (files.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-5">No files or links were submitted.</p>
  }

  return (
    <div className="p-3 space-y-4">
      {/* Media grid */}
      {media.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Files ({media.length})
          </p>
          <div className={media.length === 1 ? 'flex flex-col gap-2' : 'grid grid-cols-2 gap-3'}>
            {media.map(({ ref, signedUrl }) => {
              const isVideo = ref.type === 'video'
              const label = ref.title?.replace('[Final] ', '') ?? (isVideo ? 'Video' : 'Image')
              const fileUrl = signedUrl ?? ref.url

              return (
                <div key={ref.id} className="rounded-lg overflow-hidden border border-border bg-gray-900">
                  {/* Media preview */}
                  <div style={{ aspectRatio: '16/9' }} className="relative">
                    {isVideo ? (
                      fileUrl ? (
                        <video
                          src={fileUrl}
                          controls
                          preload="metadata"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                          <FileVideo className="w-6 h-6 text-gray-500" />
                          <span className="text-[10px] text-gray-400 px-2 text-center">{label}</span>
                        </div>
                      )
                    ) : (
                      fileUrl ? (
                        <img src={fileUrl} alt={label} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground p-2 text-center bg-secondary">
                          {label}
                        </div>
                      )
                    )}

                    {/* Type badge */}
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-medium pointer-events-none">
                      {isVideo ? 'VID' : 'IMG'}
                    </div>
                  </div>

                  {/* Always-visible action bar */}
                  {fileUrl && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted border-t border-border">
                      <span className="text-xs text-muted-foreground truncate flex-1">{label}</span>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View full size"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-card border border-border text-xs text-foreground hover:bg-secondary transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </a>
                      <button
                        type="button"
                        title="Download"
                        onClick={() => handleDownload(fileUrl, label)}
                        disabled={downloading === fileUrl}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-card border border-border text-xs text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                      >
                        {downloading === fileUrl
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Download className="w-3.5 h-3.5" />}
                        Download
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Delivery links */}
      {links.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Delivery Links ({links.length})
          </p>
          <div className="space-y-1.5">
            {links.map(({ ref }) => (
              <a
                key={ref.id}
                href={ref.url ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted border border-border text-xs text-blue-500 hover:bg-secondary hover:border-border transition-colors group"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate flex-1 group-hover:underline">{ref.url}</span>
                <span className="shrink-0 text-muted-foreground">Open →</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
