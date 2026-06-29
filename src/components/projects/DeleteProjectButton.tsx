'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteProject } from '@/lib/actions/project.actions'
import { Trash2 } from 'lucide-react'

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      await deleteProject(projectId)
      router.push('/admin/projects')
    })
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 h-9">
        <span className="text-xs text-red-700 font-medium">Delete project and all tasks?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-50 shrink-0"
        >
          {isPending ? 'Deleting…' : 'Yes, delete'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs text-slate-400 hover:text-slate-600 shrink-0"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      title="Delete project"
      aria-label="Delete project"
      className="inline-flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-input hover:border-red-200 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
