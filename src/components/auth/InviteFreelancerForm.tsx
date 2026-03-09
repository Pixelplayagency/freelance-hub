'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Check, Copy } from 'lucide-react'

export function InviteFreelancerForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

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
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate invite')
      setInviteLink(data.link)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate invite')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (inviteLink) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-green-600">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Invite link generated for <strong>{email}</strong></span>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-2">Share this link with the freelancer:</p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={inviteLink}
              className="text-xs font-mono bg-gray-50"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Link expires in 24 hours.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setInviteLink(null); setEmail('') }}
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
      <Button type="submit" className="w-full" style={{ backgroundColor: '#f24a49' }} disabled={loading}>
        {loading ? 'Generating…' : 'Generate invite link'}
      </Button>
    </form>
  )
}
