'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'

export function LoginForm() {
  const supabase = useSupabase()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    // Step 1: resolve username → email (server-side, bypasses RLS)
    const res = await fetch('/api/auth/resolve-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? 'Username not found')
      setLoading(false)
      return
    }

    // Step 2: sign in with resolved email
    const { data, error } = await supabase.auth.signInWithPassword({ email: json.email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // Step 3: redirect based on role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()
    const destination = profile?.role === 'freelancer' ? '/freelancer' : '/admin'
    router.push(destination)
    router.refresh()
  }

  return (
    <form onSubmit={handleEmailLogin} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="your username"
          value={username}
          onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
          required
          autoComplete="username"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full" style={{ backgroundColor: '#f24a49' }} disabled={loading}>
        {loading ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
