'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createTask, updateTask } from '@/lib/actions/task.actions'
import { getSignedUploadUrl, saveTaskReference } from '@/lib/actions/upload.actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ExternalLink, ImagePlus, Link2, Loader2, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { DeadlinePicker } from './DeadlinePicker'
import type { Profile, Task } from '@/lib/types/app.types'

interface TaskFormProps {
  projectId: string
  freelancers: Pick<Profile, 'id' | 'full_name' | 'email'>[]
  task?: Task
  onSuccess?: (newTask?: Task) => void
}

interface PendingLink {
  url: string
  label: string
}

export function TaskForm({ projectId, freelancers, task, onSuccess }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [assignedTo, setAssignedTo] = useState<string>(task?.assigned_to ?? '__none__')
  // Split stored timestamp into date + time for inputs
  const [dueDate, setDueDate] = useState(() => {
    if (!task?.due_date) return ''
    return task.due_date.slice(0, 10) // YYYY-MM-DD
  })
  const [dueTime, setDueTime] = useState(() => {
    if (!task?.due_date) return ''
    const t = task.due_date.slice(11, 16) // HH:MM
    return t === '00:00' ? '' : t
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Pending links (creation only)
  const [pendingLinks, setPendingLinks] = useState<PendingLink[]>([])
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLabel, setLinkLabel] = useState('')

  // Pending files (creation only)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  function addPendingLink() {
    if (!linkUrl) return
    setPendingLinks(prev => [...prev, { url: linkUrl, label: linkLabel }])
    setLinkUrl('')
    setLinkLabel('')
    setShowLinkForm(false)
  }

  function removePendingLink(index: number) {
    setPendingLinks(prev => prev.filter((_, i) => i !== index))
  }

  function handleFiles(files: FileList | null) {
    if (!files) return
    const valid = Array.from(files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
    if (valid.length < files.length) toast.error('Only images and videos are supported')
    setPendingFiles(prev => [...prev, ...valid])
  }

  function removePendingFile(index: number) {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (task) {
        const deadlineValue = dueDate
          ? dueTime ? `${dueDate}T${dueTime}:00` : `${dueDate}T00:00:00`
          : null

        await updateTask(task.id, {
          title,
          description: description || undefined,
          assigned_to: assignedTo === '__none__' ? null : assignedTo,
          due_date: deadlineValue,
        })
        toast.success('Task updated')
        onSuccess?.()
      } else {
        const deadlineValue = dueDate
          ? dueTime ? `${dueDate}T${dueTime}:00` : `${dueDate}T00:00:00`
          : null

        const newTask = await createTask({
          project_id: projectId,
          title,
          description: description || undefined,
          assigned_to: assignedTo === '__none__' ? null : assignedTo,
          due_date: deadlineValue,
          status: 'todo',
        })

        // Upload pending files
        for (const file of pendingFiles) {
          try {
            const { signedUrl, path } = await getSignedUploadUrl(newTask.id, file.name)
            const res = await fetch(signedUrl, {
              method: 'PUT',
              body: file,
              headers: { 'Content-Type': file.type },
            })
            if (!res.ok) throw new Error('Upload failed')
            await saveTaskReference(newTask.id, {
              type: file.type.startsWith('image/') ? 'image' : 'video',
              storage_path: path,
              title: file.name,
            })
          } catch {
            toast.error(`Failed to upload ${file.name}`)
          }
        }

        // Save pending links
        for (const link of pendingLinks) {
          try {
            await saveTaskReference(newTask.id, {
              type: 'link',
              url: link.url,
              title: link.label || link.url,
            })
          } catch {
            toast.error(`Failed to save link ${link.url}`)
          }
        }

        toast.success('Task created')
        onSuccess?.(newTask as Task)
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save task')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="e.g. Create Instagram Reel"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe the task…"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      {/* Assign to */}
      <div className="space-y-1.5">
        <Label>Assign to</Label>
        <Select value={assignedTo} onValueChange={setAssignedTo}>
          <SelectTrigger>
            <SelectValue placeholder="Select freelancer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Unassigned</SelectItem>
            {freelancers.map(f => (
              <SelectItem key={f.id} value={f.id}>
                {f.full_name ?? f.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Deadline */}
      <div className="space-y-1.5">
        <Label>Deadline</Label>
        <DeadlinePicker
          date={dueDate}
          time={dueTime}
          onDateChange={setDueDate}
          onTimeChange={setDueTime}
        />
      </div>

      {/* Concept reference links — only shown during task creation */}
      {!task && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5" />
            Reference links
          </Label>

          {pendingLinks.length > 0 && (
            <div className="space-y-1.5">
              {pendingLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50 text-sm">
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="flex-1 truncate text-slate-700">{link.label || link.url}</span>
                  <button type="button" onClick={() => removePendingLink(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showLinkForm ? (
            <div className="space-y-2 p-3 rounded-lg border border-dashed border-gray-200 bg-gray-50/50">
              <Input
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                className="h-8 text-sm"
                autoFocus
              />
              <Input
                placeholder="Label (optional)"
                value={linkLabel}
                onChange={e => setLinkLabel(e.target.value)}
                className="h-8 text-sm"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={addPendingLink}
                  disabled={!linkUrl}
                  style={{ backgroundColor: '#f24a49' }}
                  className="text-white"
                >
                  Add
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => { setShowLinkForm(false); setLinkUrl(''); setLinkLabel('') }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLinkForm(true)}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors w-full border border-dashed border-gray-200 rounded-lg px-3 py-2 hover:border-gray-300"
            >
              <Plus className="w-3.5 h-3.5" />
              Add link
            </button>
          )}
        </div>
      )}

      {/* Upload images / videos — only shown during task creation */}
      {!task && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <ImagePlus className="w-3.5 h-3.5" />
            Images / videos
          </Label>

          {pendingFiles.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {pendingFiles.map((file, i) => (
                <div key={i} className="relative group aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 p-1 text-center">
                      {file.name}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removePendingFile(i)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded bg-white/90 text-gray-500 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'w-full border-2 border-dashed border-gray-200 rounded-lg py-5 text-center transition-colors',
              'hover:border-[#f24a49]/40 hover:bg-[#fff3f3]/30'
            )}
          >
            <div className="flex flex-col items-center gap-1.5 text-gray-400">
              <ImagePlus className="w-5 h-5" />
              <span className="text-sm">Click to upload</span>
              <span className="text-xs">PNG, JPG, GIF, MP4, MOV</span>
            </div>
          </button>
        </div>
      )}

      <Button type="submit" className="w-full text-white" style={{ backgroundColor: '#f24a49' }} disabled={loading}>
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {task ? 'Saving…' : 'Creating…'}
          </span>
        ) : task ? 'Save changes' : 'Create task'}
      </Button>
    </form>
  )
}
