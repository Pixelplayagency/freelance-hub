'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createTask, updateTask } from '@/lib/actions/task.actions'
import { getSignedUploadUrl, saveTaskReference } from '@/lib/actions/upload.actions'
import { ImageUpload } from './ImageUpload'
import { LinksList } from './LinksList'
import { VideoReferenceAdd } from './VideoReferenceAdd'
import { FileList } from './FileList'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ChevronDown, ExternalLink, FileText, ImagePlus, Link2, Loader2, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { DeadlinePicker } from './DeadlinePicker'
import type { Priority, Profile, Task, TaskReference } from '@/lib/types/app.types'
import { PRIORITY_CONFIG } from '@/lib/types/app.types'

interface TaskFormProps {
  projectId: string
  freelancers: Pick<Profile, 'id' | 'full_name' | 'email'>[]
  task?: Task
  references?: TaskReference[]
  onSuccess?: (newTask?: Task) => void
  onCancel?: () => void
}

interface PendingLink {
  url: string
  label: string
}

export function TaskForm({ projectId, freelancers, task, references = [], onSuccess, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [assignedTo, setAssignedTo] = useState<string[]>(task?.assigned_to ? [task.assigned_to] : [])
  const [assigneeOpen, setAssigneeOpen] = useState(false)
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
  const [priority, setPriority] = useState<Priority>((task as any)?.priority ?? 'medium')
  const [taskType, setTaskType] = useState<'standard' | 'simple'>((task as any)?.task_type ?? 'standard')
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

  // Pending docs — PDFs, Word docs, logo SVGs/PNGs (creation only)
  const [pendingDocs, setPendingDocs] = useState<File[]>([])
  const docInputRef = useRef<HTMLInputElement>(null)

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

  const DOC_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/svg+xml', 'image/png']
  function handleDocs(files: FileList | null) {
    if (!files) return
    const valid = Array.from(files).filter(f => DOC_TYPES.includes(f.type))
    if (valid.length < files.length) toast.error('Only PDF, DOC, SVG, and PNG files are supported')
    setPendingDocs(prev => [...prev, ...valid])
  }

  function removePendingDoc(index: number) {
    setPendingDocs(prev => prev.filter((_, i) => i !== index))
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
          assigned_to: assignedTo[0] ?? null,
          due_date: deadlineValue,
          priority,
          assignee_ids: assignedTo,
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
          assigned_to: assignedTo[0] ?? null,
          due_date: deadlineValue,
          status: 'todo',
          priority,
          task_type: taskType,
          assignee_ids: assignedTo,
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

        // Upload pending docs
        for (const file of pendingDocs) {
          try {
            const { signedUrl, path } = await getSignedUploadUrl(newTask.id, file.name)
            const res = await fetch(signedUrl, {
              method: 'PUT',
              body: file,
              headers: { 'Content-Type': file.type },
            })
            if (!res.ok) throw new Error('Upload failed')
            await saveTaskReference(newTask.id, {
              type: 'file',
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
    <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 px-6 pt-4">
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

      {/* Assign to — multi-select */}
      <div className="space-y-1.5">
        <Label>Assign to</Label>
        <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between gap-2 border border-input rounded-md px-3 py-2 text-sm bg-background hover:bg-muted transition-colors text-left"
            >
              <span className={assignedTo.length === 0 ? 'text-muted-foreground' : 'text-foreground'}>
                {assignedTo.length === 0
                  ? 'Select people'
                  : assignedTo.length === 1
                    ? (freelancers.find(f => f.id === assignedTo[0])?.full_name ?? freelancers.find(f => f.id === assignedTo[0])?.email ?? '1 selected')
                    : `${assignedTo.length} selected`}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-1" align="start">
            <div className="max-h-48 overflow-y-auto">
              {freelancers.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-3 text-center">No one to assign yet</p>
              ) : (
                freelancers.map(f => {
                  const checked = assignedTo.includes(f.id)
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setAssignedTo(prev => checked ? prev.filter(id => id !== f.id) : [...prev, f.id])}
                      className="w-full flex items-center gap-2.5 px-2 py-2 rounded hover:bg-muted transition-colors text-left"
                    >
                      <div className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                        checked ? 'border-primary bg-primary' : 'border-border'
                      )}>
                        {checked && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{f.full_name ?? f.email}</p>
                        {f.full_name && <p className="text-xs text-muted-foreground truncate">{f.email}</p>}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
            {assignedTo.length > 0 && (
              <div className="border-t mt-1 pt-1">
                <button
                  type="button"
                  onClick={() => setAssignedTo([])}
                  className="w-full text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 text-left transition-colors"
                >
                  Clear selection
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Selected pills */}
        {assignedTo.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {assignedTo.map(id => {
              const f = freelancers.find(f => f.id === id)
              if (!f) return null
              return (
                <span key={id} className="flex items-center gap-1 text-xs bg-muted border border-border rounded-full px-2 py-0.5">
                  {f.full_name ?? f.email}
                  <button type="button" onClick={() => setAssignedTo(prev => prev.filter(x => x !== id))}>
                    <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </span>
              )
            })}
          </div>
        )}
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

      {/* Priority */}
      <div className="space-y-1.5">
        <Label>Priority</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {(['low', 'medium', 'high', 'urgent'] as Priority[]).map(p => {
            const cfg = PRIORITY_CONFIG[p]
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  'flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-xs font-medium transition-all',
                  priority === p
                    ? `${cfg.bg} ${cfg.color} border-current/20`
                    : 'border-border text-muted-foreground hover:border-muted-foreground'
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Files — docs, PDFs, logo SVGs/PNGs */}
      {task ? (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Files
          </Label>
          <FileList taskId={task.id} references={references.filter(r => r.type === 'file')} isAdmin={true} />
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Files
          </Label>

          {pendingDocs.length > 0 && (
            <div className="space-y-1.5">
              {pendingDocs.map((file, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted text-sm">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate text-foreground">{file.name}</span>
                  <button type="button" onClick={() => removePendingDoc(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={docInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.svg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/svg+xml,image/png"
            multiple
            className="hidden"
            onChange={e => handleDocs(e.target.files)}
          />
          <button
            type="button"
            onClick={() => docInputRef.current?.click()}
            className={cn(
              'w-full border-2 border-dashed border-border rounded-lg py-5 text-center transition-colors',
              'hover:border-primary/40 hover:bg-primary/5'
            )}
          >
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
              <FileText className="w-5 h-5" />
              <span className="text-sm">Click to upload</span>
              <span className="text-xs">PDF, DOC, SVG, PNG</span>
            </div>
          </button>
        </div>
      )}

      {/* Concept reference links */}
      {task ? (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5" />
            Reference links
          </Label>
          <LinksList taskId={task.id} references={references.filter(r => r.type === 'link')} isAdmin={true} />
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5" />
            Reference links
          </Label>

          {pendingLinks.length > 0 && (
            <div className="space-y-1.5">
              {pendingLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted text-sm">
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate text-foreground">{link.label || link.url}</span>
                  <button type="button" onClick={() => removePendingLink(i)} className="text-muted-foreground hover:text-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showLinkForm ? (
            <div className="space-y-2 p-3 rounded-lg border border-dashed border-border bg-muted/50">
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
                  style={{ backgroundColor: 'var(--primary)' }}
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
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-full border border-dashed border-border rounded-lg px-3 py-2 hover:border-muted-foreground"
            >
              <Plus className="w-3.5 h-3.5" />
              Add link
            </button>
          )}
        </div>
      )}

      {/* Upload images / videos */}
      {task ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <ImagePlus className="w-3.5 h-3.5" />
              Images
            </Label>
            <ImageUpload taskId={task.id} references={references.filter(r => r.type === 'image')} isAdmin={true} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <ImagePlus className="w-3.5 h-3.5" />
              Videos
            </Label>
            <VideoReferenceAdd taskId={task.id} references={references.filter(r => r.type === 'video')} isAdmin={true} />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <ImagePlus className="w-3.5 h-3.5" />
            Images / videos
          </Label>

          {pendingFiles.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {pendingFiles.map((file, i) => (
                <div key={i} className="relative group aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-1 text-center">
                      {file.name}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removePendingFile(i)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 rounded bg-card/90 text-muted-foreground hover:text-red-500 transition-all"
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
              'w-full border-2 border-dashed border-border rounded-lg py-5 text-center transition-colors',
              'hover:border-primary/40 hover:bg-primary/5'
            )}
          >
            <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
              <ImagePlus className="w-5 h-5" />
              <span className="text-sm">Click to upload</span>
              <span className="text-xs">PNG, JPG, GIF, MP4, MOV</span>
            </div>
          </button>
        </div>
      )}

      {/* Task type — only shown on creation */}
      {!task && (
        <div className="space-y-1.5">
          <Label>Task type</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['standard', 'simple'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setTaskType(type)}
                className={cn(
                  'flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg border text-left transition-all text-sm',
                  taskType === type
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-foreground hover:border-muted-foreground'
                )}
              >
                <span className="font-medium capitalize">{type === 'standard' ? 'Standard' : 'Simple'}</span>
                <span className="text-xs text-muted-foreground">
                  {type === 'standard' ? 'Submit work for admin review' : 'Mark complete directly'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      </div>

      {/* Fixed footer — always visible */}
      <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4 shrink-0">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          className="min-w-36 text-white"
          style={{ backgroundColor: 'var(--primary)' }}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {task ? 'Saving…' : 'Creating…'}
            </span>
          ) : task ? 'Save changes' : 'Create task'}
        </Button>
      </div>
    </form>
  )
}
