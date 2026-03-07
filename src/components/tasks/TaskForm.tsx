'use client'

import { useState } from 'react'
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
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Profile, Task } from '@/lib/types/app.types'

interface TaskFormProps {
  projectId: string
  freelancers: Pick<Profile, 'id' | 'full_name' | 'email'>[]
  task?: Task
  onSuccess?: (newTask?: Task) => void
}

export function TaskForm({ projectId, freelancers, task, onSuccess }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [assignedTo, setAssignedTo] = useState<string>(task?.assigned_to ?? '__none__')
  const [dueDate, setDueDate] = useState(task?.due_date ?? '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (task) {
        await updateTask(task.id, {
          title,
          description: description || undefined,
          assigned_to: assignedTo === '__none__' ? null : assignedTo,
          due_date: dueDate || null,
        })
        toast.success('Task updated')
        onSuccess?.()
      } else {
        const newTask = await createTask({
          project_id: projectId,
          title,
          description: description || undefined,
          assigned_to: assignedTo === '__none__' ? null : assignedTo,
          due_date: dueDate || null,
          status: 'todo',
        })
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

      <div className="space-y-1.5">
        <Label htmlFor="dueDate">Due date</Label>
        <Input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
        {loading ? 'Saving…' : task ? 'Save changes' : 'Create task'}
      </Button>
    </form>
  )
}
