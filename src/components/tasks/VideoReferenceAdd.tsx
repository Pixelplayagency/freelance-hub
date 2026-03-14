'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
import { VideoEmbed } from './VideoEmbed'
import { saveTaskReference, deleteTaskReference } from '@/lib/actions/upload.actions'
import { toast } from 'sonner'
import type { TaskReference } from '@/lib/types/app.types'

interface VideoReferenceAddProps {
  taskId: string
  references: TaskReference[]
  isAdmin: boolean
}

export function VideoReferenceAdd({ taskId, references, isAdmin }: VideoReferenceAddProps) {
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!url) return
    setAdding(true)
    try {
      await saveTaskReference(taskId, { type: 'video', url, title: url })
      toast.success('Video added')
      setUrl('')
      setShowForm(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add video')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(refId: string) {
    try {
      await deleteTaskReference(refId, taskId)
      toast.success('Video removed')
    } catch {
      toast.error('Failed to remove video')
    }
  }

  return (
    <div className="space-y-4">
      {references.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">No videos attached yet.</p>
      )}

      <div className="space-y-4">
        {references.map(ref => (
          <div key={ref.id} className="space-y-2">
            <VideoEmbed url={ref.url!} />
            {isAdmin && (
              <button
                onClick={() => handleDelete(ref.id)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {isAdmin && (
        <>
          {showForm ? (
            <form onSubmit={handleAdd} className="space-y-3 p-3 rounded-lg border border-dashed border-border">
              <div className="space-y-1">
                <Label className="text-xs">YouTube or Vimeo URL *</Label>
                <Input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  required
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" style={{ backgroundColor: '#f24a49' }} disabled={adding}>
                  {adding ? 'Adding…' : 'Add video'}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowForm(true)}
              className="w-full border-dashed"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add video
            </Button>
          )}
        </>
      )}
    </div>
  )
}
