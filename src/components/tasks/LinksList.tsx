'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ExternalLink, Plus, Trash2 } from 'lucide-react'
import { saveTaskReference, deleteTaskReference } from '@/lib/actions/upload.actions'
import { toast } from 'sonner'
import type { TaskReference } from '@/lib/types/app.types'

interface LinksListProps {
  taskId: string
  references: TaskReference[]
  isAdmin: boolean
}

export function LinksList({ taskId, references, isAdmin }: LinksListProps) {
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!url) return
    setAdding(true)
    try {
      await saveTaskReference(taskId, { type: 'link', url, title: label || url })
      toast.success('Link added')
      setUrl('')
      setLabel('')
      setShowForm(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add link')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(refId: string) {
    try {
      await deleteTaskReference(refId, taskId)
      toast.success('Link removed')
    } catch {
      toast.error('Failed to remove link')
    }
  }

  return (
    <div className="space-y-3">
      {references.length === 0 && !showForm && (
        <p className="text-sm text-gray-400">No links attached yet.</p>
      )}

      <div className="space-y-2">
        {references.map(ref => (
          <div key={ref.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted group">
            <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
            <a
              href={ref.url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:underline flex-1 truncate" style={{ color: '#f24a49' }}
            >
              {ref.title ?? ref.url}
            </a>
            {isAdmin && (
              <button
                onClick={() => handleDelete(ref.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-gray-400 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
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
                <Label className="text-xs">URL *</Label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  required
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Label (optional)</Label>
                <Input
                  placeholder="e.g. Brand guidelines"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" style={{ backgroundColor: '#f24a49' }} disabled={adding}>
                  {adding ? 'Adding…' : 'Add link'}
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
              Add link
            </Button>
          )}
        </>
      )}
    </div>
  )
}
