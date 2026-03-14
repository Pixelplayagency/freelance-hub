'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Trash2, CalendarDays, Loader2, Settings2,
  Instagram, Facebook, ArrowRight, X, ImageIcon,
} from 'lucide-react'
import { createContentClient, deleteContentClient, updateContentClient } from '@/lib/actions/content-plan.actions'
import { uploadClientImage } from '@/lib/actions/upload.actions'
import type { ContentClient } from '@/lib/types/app.types'

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.85 4.85 0 0 1-1.01-.05z" />
    </svg>
  )
}

async function compressImage(file: File, maxWidth: number, quality = 0.85): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = url
  })
}

interface EditState {
  client: ContentClient
  name: string
  description: string
  color: string
  instagram_url: string
  facebook_url: string
  tiktok_url: string
  coverPreview: string | null   // base64 preview (new upload)
  coverFile: string | null      // base64 to upload
  avatarPreview: string | null
  avatarFile: string | null
}

export function ClientListPage({ clients: initial, isAdmin }: { clients: ContentClient[]; isAdmin: boolean }) {
  const router = useRouter()
  const [clients, setClients] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [edit, setEdit] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const basePath = isAdmin ? '/admin/content-planner' : '/freelancer/content-planner'

  function handleCreate() {
    if (!newName.trim()) return
    startTransition(async () => {
      await createContentClient(newName.trim())
      setNewName('')
      setAdding(false)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteContentClient(id)
      setClients(prev => prev.filter(c => c.id !== id))
    })
  }

  function openEdit(client: ContentClient) {
    setEdit({
      client,
      name: client.name,
      description: client.description ?? '',
      color: client.color ?? '#f24a49',
      instagram_url: client.instagram_url ?? '',
      facebook_url: client.facebook_url ?? '',
      tiktok_url: client.tiktok_url ?? '',
      coverPreview: null,
      coverFile: null,
      avatarPreview: null,
      avatarFile: null,
    })
  }

  async function handleCoverPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !edit) return
    const b64 = await compressImage(file, 1400)
    setEdit(s => s ? { ...s, coverPreview: b64, coverFile: b64 } : s)
  }

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !edit) return
    const b64 = await compressImage(file, 400)
    setEdit(s => s ? { ...s, avatarPreview: b64, avatarFile: b64 } : s)
  }

  async function handleSaveEdit() {
    if (!edit) return
    setSaving(true)
    try {
      let cover_image_url = edit.client.cover_image_url
      let avatar_url = edit.client.avatar_url
      if (edit.coverFile) {
        cover_image_url = await uploadClientImage(edit.coverFile, edit.client.id, 'cover')
      }
      if (edit.avatarFile) {
        avatar_url = await uploadClientImage(edit.avatarFile, edit.client.id, 'avatar')
      }
      await updateContentClient(edit.client.id, {
        name: edit.name.trim() || edit.client.name,
        description: edit.description.trim() || null,
        color: edit.color,
        instagram_url: edit.instagram_url.trim() || null,
        facebook_url: edit.facebook_url.trim() || null,
        tiktok_url: edit.tiktok_url.trim() || null,
        cover_image_url,
        avatar_url,
      })
      setClients(prev => prev.map(c => c.id === edit.client.id ? {
        ...c,
        name: edit.name.trim() || c.name,
        description: edit.description.trim() || null,
        color: edit.color,
        instagram_url: edit.instagram_url.trim() || null,
        facebook_url: edit.facebook_url.trim() || null,
        tiktok_url: edit.tiktok_url.trim() || null,
        cover_image_url: cover_image_url ?? null,
        avatar_url: avatar_url ?? null,
      } : c))
      setEdit(null)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Planner</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Select a client to view or manage their content calendar</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-sm font-medium text-white px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: '#f24a49' }}
          >
            <Plus className="w-4 h-4" /> Add Client
          </button>
        )}
      </div>

      {/* Add client inline form */}
      {adding && (
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 max-w-sm">
          <input
            autoFocus
            type="text"
            placeholder="Client / brand name…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setAdding(false) }}
            className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-[#f24a49]"
          />
          <button
            onClick={handleCreate}
            disabled={isPending || !newName.trim()}
            className="text-xs text-white px-3 py-2 rounded-lg disabled:opacity-50 transition-colors"
            style={{ backgroundColor: '#f24a49' }}
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create'}
          </button>
          <button onClick={() => setAdding(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
        </div>
      )}

      {/* Client grid */}
      {clients.length === 0 ? (
        <div className="bg-card border border-border rounded-xl flex flex-col items-center justify-center py-20 text-center">
          <CalendarDays className="w-10 h-10 text-muted-foreground/20 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No clients yet</p>
          {isAdmin && (
            <p className="text-xs text-muted-foreground mt-1">Click "Add Client" to create your first content planner</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(client => {
            const color = client.color || '#f24a49'
            const initial = client.name.charAt(0).toUpperCase()
            const hasSocials = client.instagram_url || client.facebook_url || client.tiktok_url
            return (
              <a
                key={client.id}
                href={`${basePath}/${client.id}`}
                className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col group cursor-pointer"
              >
                {/* Cover banner */}
                <div className="relative h-28 overflow-hidden shrink-0">
                  {client.cover_image_url ? (
                    <img src={client.cover_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{ background: `linear-gradient(135deg, ${color}cc, ${color})` }}
                    />
                  )}
                  {isAdmin && (
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); openEdit(client) }}
                      className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm text-white p-1.5 rounded-lg hover:bg-black/60 transition-colors"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!isAdmin && (
                    <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="px-4 pb-0 -mt-7 relative flex-1 flex flex-col">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full border-2 border-card bg-card overflow-hidden shrink-0 mb-2 shadow-sm">
                    {client.avatar_url ? (
                      <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-xl font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {initial}
                      </div>
                    )}
                  </div>

                  {/* Name + socials */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-semibold text-foreground leading-snug flex-1 min-w-0 truncate group-hover:text-[#f24a49] transition-colors">
                      {client.name}
                    </h3>
                    {hasSocials && (
                      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                        {client.instagram_url && (
                          <button
                            type="button"
                            onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(client.instagram_url!, '_blank', 'noopener,noreferrer') }}
                            className="text-muted-foreground hover:text-[#E1306C] transition-colors"
                          >
                            <Instagram className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {client.facebook_url && (
                          <button
                            type="button"
                            onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(client.facebook_url!, '_blank', 'noopener,noreferrer') }}
                            className="text-muted-foreground hover:text-[#1877F2] transition-colors"
                          >
                            <Facebook className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {client.tiktok_url && (
                          <button
                            type="button"
                            onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(client.tiktok_url!, '_blank', 'noopener,noreferrer') }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <TikTokIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {client.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                      {client.description}
                    </p>
                  ) : (
                    <div className="mb-3" />
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-border flex items-center justify-between mt-auto">
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> Calendar
                  </span>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(client.id) }}
                        disabled={isPending}
                        className="p-1 rounded text-muted-foreground/40 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: '#f24a49' }}>
                      Open <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      )}

      {/* Edit modal */}
      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setEdit(null)} />
          <div className="relative bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h2 className="font-semibold text-foreground">Edit Client Card</h2>
              <button onClick={() => !saving && setEdit(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

              {/* Cover image */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Cover Image</label>
                <div
                  className="relative h-32 rounded-xl overflow-hidden cursor-pointer border border-dashed border-border hover:border-[#f24a49] transition-colors"
                  onClick={() => coverInputRef.current?.click()}
                >
                  {edit.coverPreview || edit.client.cover_image_url ? (
                    <img
                      src={edit.coverPreview ?? edit.client.cover_image_url!}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col items-center justify-center gap-1"
                      style={{ background: `linear-gradient(135deg, ${edit.color}44, ${edit.color}88)` }}
                    >
                      <ImageIcon className="w-6 h-6 text-white/60" />
                      <span className="text-xs text-white/60">Click to upload cover</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 hover:opacity-100 text-xs text-white font-medium transition-opacity">Change</span>
                  </div>
                </div>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverPick} />
              </div>

              {/* Avatar image */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Logo / Avatar</label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-16 h-16 rounded-full overflow-hidden border-2 border-border cursor-pointer shrink-0"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {edit.avatarPreview || edit.client.avatar_url ? (
                      <img src={edit.avatarPreview ?? edit.client.avatar_url!} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: edit.color }}>
                        {edit.name.charAt(0).toUpperCase() || edit.client.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5 hover:border-[#f24a49] hover:text-foreground transition-colors"
                  >
                    Upload logo
                  </button>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Client / Brand Name</label>
                <input
                  type="text"
                  value={edit.name}
                  onChange={e => setEdit(s => s ? { ...s, name: e.target.value } : s)}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-[#f24a49]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
                <textarea
                  rows={2}
                  value={edit.description}
                  onChange={e => setEdit(s => s ? { ...s, description: e.target.value } : s)}
                  placeholder="Short brand description…"
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-[#f24a49] resize-none"
                />
              </div>

              {/* Brand color */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Brand Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={edit.color}
                    onChange={e => setEdit(s => s ? { ...s, color: e.target.value } : s)}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
                  />
                  <span className="text-sm text-muted-foreground font-mono">{edit.color}</span>
                </div>
              </div>

              {/* Social links */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground block">Social Links</label>
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="url"
                    value={edit.instagram_url}
                    onChange={e => setEdit(s => s ? { ...s, instagram_url: e.target.value } : s)}
                    placeholder="https://instagram.com/…"
                    className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-[#f24a49]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="url"
                    value={edit.facebook_url}
                    onChange={e => setEdit(s => s ? { ...s, facebook_url: e.target.value } : s)}
                    placeholder="https://facebook.com/…"
                    className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-[#f24a49]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <TikTokIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="url"
                    value={edit.tiktok_url}
                    onChange={e => setEdit(s => s ? { ...s, tiktok_url: e.target.value } : s)}
                    placeholder="https://tiktok.com/@…"
                    className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-[#f24a49]"
                  />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => !saving && setEdit(null)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex items-center gap-2 text-sm font-medium text-white px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#f24a49' }}
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
