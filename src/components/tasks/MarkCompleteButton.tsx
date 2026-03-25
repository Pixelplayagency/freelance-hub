'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { setTaskStatus } from '@/lib/actions/task.actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function MarkCompleteButton({ taskId }: { taskId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleComplete() {
    setLoading(true)
    try {
      await setTaskStatus(taskId, 'completed')
      toast.success('Task marked as complete!')
      router.refresh()
    } catch {
      toast.error('Failed to update task')
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleComplete}
      disabled={loading}
      className="w-full text-white gap-2"
      style={{ backgroundColor: 'var(--primary)' }}
    >
      {loading
        ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
        : <><CheckCircle2 className="w-4 h-4" /> Mark as complete</>
      }
    </Button>
  )
}
