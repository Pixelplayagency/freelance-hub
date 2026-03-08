'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, RotateCcw } from 'lucide-react'
import { setTaskStatus } from '@/lib/actions/task.actions'
import { toast } from 'sonner'

export function AdminReviewActions({ taskId }: { taskId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'revision' | null>(null)

  async function handleApprove() {
    setLoading('approve')
    try {
      await setTaskStatus(taskId, 'completed')
      toast.success('Task approved and marked complete')
      router.refresh()
    } catch {
      toast.error('Failed to approve task')
      setLoading(null)
    }
  }

  async function handleRevision() {
    setLoading('revision')
    try {
      await setTaskStatus(taskId, 'in_progress')
      toast.success('Sent back for revision')
      router.refresh()
    } catch {
      toast.error('Failed to request revision')
      setLoading(null)
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-amber-100 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-sm font-semibold text-amber-800">Pending your review</span>
        <span className="ml-auto text-xs text-amber-600">Freelancer submitted work</span>
      </div>
      <div className="px-4 py-3 flex items-center gap-3">
        <button
          onClick={handleRevision}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {loading === 'revision'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <RotateCcw className="w-4 h-4" />}
          Needs revision
        </button>
        <button
          onClick={handleApprove}
          disabled={loading !== null}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#f24a49' }}
        >
          {loading === 'approve'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <CheckCircle2 className="w-4 h-4" />}
          Approve & complete
        </button>
      </div>
    </div>
  )
}
