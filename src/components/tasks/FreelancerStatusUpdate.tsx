'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateTaskStatus } from '@/lib/actions/task.actions'
import { toast } from 'sonner'
import { TASK_STATUSES } from '@/lib/types/app.types'
import type { TaskStatus } from '@/lib/types/app.types'
import { useRouter } from 'next/navigation'

export function FreelancerStatusUpdate({
  taskId,
  currentStatus,
}: {
  taskId: string
  currentStatus: TaskStatus
}) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleChange(newStatus: string) {
    setLoading(true)
    try {
      await updateTaskStatus(taskId, newStatus as TaskStatus, 0)
      setStatus(newStatus as TaskStatus)
      toast.success('Status updated')
      router.refresh()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const isCompleted = status === 'completed'

  return (
    <Select value={status} onValueChange={handleChange} disabled={loading || isCompleted}>
      <SelectTrigger className="w-40 h-8 text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TASK_STATUSES.filter(s => s.id !== 'completed' || isCompleted).map(s => (
          <SelectItem key={s.id} value={s.id} disabled={s.id === 'completed'}>
            {s.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
