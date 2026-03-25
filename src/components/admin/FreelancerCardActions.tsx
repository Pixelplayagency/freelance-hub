'use client'

import { useTransition } from 'react'
import { CheckCircle2, Loader2, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { approveFreelancer, removeFreelancer } from '@/lib/actions/freelancer.actions'

interface Props {
  id: string
  mode: 'pending' | 'active'
}

export function FreelancerCardActions({ id, mode }: Props) {
  const [approvePending, startApprove] = useTransition()
  const [removePending, startRemove] = useTransition()

  function handleApprove() {
    startApprove(async () => {
      try {
        await approveFreelancer(id)
        toast.success('Freelancer approved')
      } catch {
        toast.error('Failed to approve')
      }
    })
  }

  function handleRemove() {
    startRemove(async () => {
      try {
        await removeFreelancer(id)
        toast.success('Freelancer removed')
      } catch {
        toast.error('Failed to remove')
      }
    })
  }

  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
      {mode === 'pending' && (
        <button
          onClick={handleApprove}
          disabled={approvePending || removePending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          {approvePending
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <CheckCircle2 className="w-3.5 h-3.5" />}
          Approve
        </button>
      )}
      <button
        onClick={handleRemove}
        disabled={approvePending || removePending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-foreground hover:border-red-200 hover:text-red-600 hover:bg-red-500/10 transition-colors disabled:opacity-50"
      >
        {removePending
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <UserX className="w-3.5 h-3.5" />}
        Remove
      </button>
    </div>
  )
}
