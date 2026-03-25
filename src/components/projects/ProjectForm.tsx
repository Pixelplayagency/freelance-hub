'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createProject, updateProject } from '@/lib/actions/project.actions'
import { toast } from 'sonner'
import { ImagePlus, Instagram, Facebook, Loader2 } from 'lucide-react'

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" />
    </svg>
  )
}

const COLOR_OPTIONS = [
  'var(--primary)', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
]

async function compressImage(file: File, maxWidth: number, quality = 0.85): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = url
  })
}

// Upload directly from the browser to Cloudinary — avoids Next.js server action body size limits
async function uploadToCloudinary(base64: string, folder: string, publicId: string): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  if (!cloudName || !uploadPreset) throw new Error('Cloudinary not configured')

  const form = new FormData()
  form.append('file', base64)
  form.append('upload_preset', uploadPreset)
  form.append('folder', folder)
  form.append('public_id', publicId)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message ?? 'Image upload failed')
  }
  const data = await res.json()
  return data.secure_url as string
}

interface ProjectFormProps {
  onSuccess?: () => void
  projectId?: string
  initialValues?: {
    name?: string
    description?: string
    color?: string
    cover_image_url?: string | null
    avatar_url?: string | null
    instagram_url?: string | null
    facebook_url?: string | null
    tiktok_url?: string | null
  }
}

export function ProjectForm({ onSuccess, projectId, initialValues }: ProjectFormProps) {
  const router = useRouter()
  const isEditing = !!projectId

  const [name, setName] = useState(initialValues?.name ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')
  const [color, setColor] = useState(initialValues?.color ?? 'var(--primary)')
  const [instagram, setInstagram] = useState(initialValues?.instagram_url ?? '')
  const [facebook, setFacebook] = useState(initialValues?.facebook_url ?? '')
  const [tiktok, setTiktok] = useState(initialValues?.tiktok_url ?? '')

  const [coverPreview, setCoverPreview] = useState<string | null>(initialValues?.cover_image_url ?? null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialValues?.avatar_url ?? null)
  // Store the compressed base64 only until upload; null = no new image selected
  const [coverBase64, setCoverBase64] = useState<string | null>(null)
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)

  const coverInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file, 1400, 0.85)
    setCoverPreview(compressed)
    setCoverBase64(compressed)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file, 400, 0.9)
    setAvatarPreview(compressed)
    setAvatarBase64(compressed)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Project name is required'); return }
    setLoading(true)
    try {
      if (isEditing) {
        // Upload any new images directly from browser to Cloudinary
        let cover_image_url = initialValues?.cover_image_url ?? null
        let avatar_url = initialValues?.avatar_url ?? null

        if (coverBase64) {
          cover_image_url = await uploadToCloudinary(
            coverBase64,
            `freelancehub/projects/${projectId}`,
            'cover'
          )
        }
        if (avatarBase64) {
          avatar_url = await uploadToCloudinary(
            avatarBase64,
            `freelancehub/projects/${projectId}`,
            'avatar'
          )
        }

        await updateProject(projectId, {
          name, description, color,
          cover_image_url,
          avatar_url,
          instagram_url: instagram || null,
          facebook_url: facebook || null,
          tiktok_url: tiktok || null,
        })
        toast.success('Project updated')
        onSuccess?.()
        router.refresh()
      } else {
        // Create the project first to get its ID
        const project = await createProject({
          name, description, color,
          cover_image_url: null,
          avatar_url: null,
          instagram_url: instagram || null,
          facebook_url: facebook || null,
          tiktok_url: tiktok || null,
        })

        // Upload images directly from browser now that we have the project ID
        let cover_image_url: string | null = null
        let avatar_url: string | null = null

        if (coverBase64) {
          cover_image_url = await uploadToCloudinary(
            coverBase64,
            `freelancehub/projects/${project.id}`,
            'cover'
          )
        }
        if (avatarBase64) {
          avatar_url = await uploadToCloudinary(
            avatarBase64,
            `freelancehub/projects/${project.id}`,
            'avatar'
          )
        }

        if (cover_image_url || avatar_url) {
          await updateProject(project.id, { cover_image_url, avatar_url })
        }

        toast.success('Project created')
        onSuccess?.()
        router.push(`/admin/projects/${project.id}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const initial = name.charAt(0).toUpperCase()

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Cover image */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cover Image</Label>
        <div
          className="relative h-28 rounded-lg overflow-hidden border border-dashed border-border cursor-pointer group bg-muted hover:bg-secondary transition-colors"
          onClick={() => coverInputRef.current?.click()}
        >
          {coverPreview ? (
            <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-1.5"
              style={{ background: `linear-gradient(135deg, ${color}44, ${color}22)` }}
            >
              <ImagePlus className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Upload cover image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-lg">
              {coverPreview ? 'Change' : 'Upload'}
            </span>
          </div>
        </div>
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
      </div>

      {/* Avatar + Name row */}
      <div className="flex items-center gap-4">
        <div
          className="relative w-16 h-16 rounded-full border-2 border-dashed border-border overflow-hidden cursor-pointer shrink-0 group"
          onClick={() => avatarInputRef.current?.click()}
        >
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-xl font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {initial || '?'}
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <ImagePlus className="w-4 h-4 text-white" />
          </div>
        </div>
        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

        <div className="flex-1 space-y-1">
          <Label htmlFor="name">Brand / Project name *</Label>
          <Input
            id="name"
            placeholder="e.g. Makara Jewellery"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="What is this project about?"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label className="text-sm">Accent color</Label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_OPTIONS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
              style={{
                backgroundColor: c,
                outline: color === c ? `3px solid ${c}` : undefined,
                outlineOffset: '2px',
              }}
            />
          ))}
        </div>
      </div>

      {/* Social links */}
      <div className="space-y-2.5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Social Media (optional)</Label>
        <div className="space-y-2">
          <div className="relative">
            <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="url"
              placeholder="https://instagram.com/username"
              value={instagram}
              onChange={e => setInstagram(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="relative">
            <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="url"
              placeholder="https://facebook.com/page"
              value={facebook}
              onChange={e => setFacebook(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <div className="relative">
            <TikTokIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="url"
              placeholder="https://tiktok.com/@username"
              value={tiktok}
              onChange={e => setTiktok(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full text-white"
        style={{ backgroundColor: 'var(--primary)' }}
        disabled={loading}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" />{isEditing ? 'Saving…' : 'Creating…'}</>
        ) : (
          isEditing ? 'Save changes' : 'Create project'
        )}
      </Button>
    </form>
  )
}
