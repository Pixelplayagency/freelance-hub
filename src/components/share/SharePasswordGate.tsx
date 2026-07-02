'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Loader2 } from 'lucide-react'
import { unlockShareLink } from '@/lib/actions/content-share.actions'

export function SharePasswordGate({ token, clientName }: { token: string; clientName: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { ok } = await unlockShareLink(token, password)
      if (!ok) {
        setError('Incorrect password')
        setLoading(false)
        return
      }
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-base font-bold text-foreground">Password protected</h1>
          <p className="text-sm text-muted-foreground">Enter the password to view {clientName}'s content calendar.</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full h-10 px-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        {error && <p className="text-xs text-destructive text-center">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full h-10 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          View calendar
        </button>
      </form>
    </div>
  )
}
