'use client'

import { useMemo } from 'react'

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`

  // Direct video file
  if (/\.(mp4|webm|ogg)$/i.test(url)) return null

  return null
}

export function VideoEmbed({ url }: { url: string }) {
  const embedUrl = useMemo(() => getEmbedUrl(url), [url])

  if (!embedUrl) {
    // Direct video file
    return (
      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-900">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          src={url}
          controls
          className="w-full h-full object-contain"
        />
      </div>
    )
  }

  return (
    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-900">
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video"
      />
    </div>
  )
}
