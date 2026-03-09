'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Check, Copy, Loader2 } from 'lucide-react'

interface Props {
  role?: 'freelancer' | 'admin'
}

export function InviteFreelancerForm({ role = 'freelancer' }: Props) {
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate link')
      setInviteLink(data.link)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate link')
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
          <span className="text-sm font-medium">Invite link generated</span>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-2">Share this link with the {role}:</p>
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
          <p className="text-xs text-gray-400 mt-1.5">Link expires in 7 days and can only be used once.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setInviteLink(null)}
        >
          Generate another
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Generate a unique invite link and share it with the {role}. They will create their own account using the link.
      </p>
      <Button
        onClick={handleGenerate}
        className="w-full"
        style={{ backgroundColor: '#f24a49' }}
        disabled={loading}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
        ) : (
          'Generate invite link'
        )}
      </Button>
    </div>
  )
}
