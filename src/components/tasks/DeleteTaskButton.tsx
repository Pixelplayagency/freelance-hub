'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTask } from '@/lib/actions/task.actions'
import { Trash2 } from 'lucide-react'

export function DeleteTaskButton({ taskId, projectId }: { taskId: string; projectId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      await deleteTask(taskId, projectId)
      router.push(`/admin/projects/${projectId}`)
    })
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Delete task?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {isPending ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs text-muted-foreground hover:text-foreground/70"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      title="Delete task"
      className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
