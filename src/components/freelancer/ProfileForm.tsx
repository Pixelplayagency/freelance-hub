'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Camera, Loader2, User } from 'lucide-react'
import type { Profile } from '@/lib/types/app.types'

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url)
  const [loading, setLoading] = useState(false)

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function uploadAvatar(file: File): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('upload_preset', UPLOAD_PRESET)
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: fd,
    })
    if (!res.ok) throw new Error('Avatar upload failed')
    const data = await res.json()
    return data.secure_url as string
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      let avatarUrl: string | undefined = undefined
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile)
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, avatarUrl }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to update profile')

      toast.success('Profile updated!')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden hover:border-[#f24a49]/50 transition-colors group"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold" style={{ color: '#f24a49' }}>{initials}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm"
            style={{ backgroundColor: '#f24a49' }}
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Profile picture</p>
          <p className="text-xs text-muted-foreground mt-0.5">Click to upload a new photo</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarSelect}
        />
      </div>

      {/* Full Name */}
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          required
          placeholder="Your full name"
        />
      </div>

      {/* Read-only fields */}
      <div className="space-y-1.5">
        <Label>Username</Label>
        <Input value={`@${profile.username ?? ''}`} disabled className="bg-muted text-muted-foreground cursor-not-allowed" />
      </div>

      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input value={profile.email} disabled className="bg-muted text-muted-foreground cursor-not-allowed" />
      </div>

      <Button
        type="submit"
        style={{ backgroundColor: '#f24a49' }}
        disabled={loading || !fullName.trim()}
      >
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : 'Save changes'}
      </Button>
    </form>
  )
}
