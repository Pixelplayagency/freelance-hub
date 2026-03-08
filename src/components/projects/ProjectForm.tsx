'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createProject } from '@/lib/actions/project.actions'
import { toast } from 'sonner'

const COLOR_OPTIONS = [
  '#f24a49', // primary red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ef4444', // red
  '#14b8a6', // teal
]

export function ProjectForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#f24a49')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const project = await createProject({ name, description, color })
      toast.success('Project created')
      router.push(`/admin/projects/${project.id}`)
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create project')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Project name *</Label>
        <Input
          id="name"
          placeholder="e.g. Instagram Content – Jewelry Brand"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="What is this project about?"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
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

      <Button type="submit" className="w-full" style={{ backgroundColor: '#f24a49' }} disabled={loading}>
        {loading ? 'Creating…' : 'Create project'}
      </Button>
    </form>
  )
}
