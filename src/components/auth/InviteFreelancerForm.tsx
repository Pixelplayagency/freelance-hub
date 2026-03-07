'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function InviteFreelancerForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to send invite')
      setSent(true)
      toast.success(`Invite sent to ${email}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="text-3xl mb-3">📨</div>
        <h3 className="font-medium text-gray-900">Invite sent!</h3>
        <p className="text-sm text-gray-500 mt-1">
          An invitation email was sent to <strong>{email}</strong>
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-4"
          onClick={() => { setSent(false); setEmail('') }}
        >
          Invite another
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleInvite} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Freelancer email</Label>
        <Input
          id="email"
          type="email"
          placeholder="freelancer@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
        {loading ? 'Sending…' : 'Send invitation'}
      </Button>
    </form>
  )
}
