import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { username } = await request.json()
  if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 })

  const service = createSupabaseServiceClient()
  const { data, error } = await service
    .from('profiles')
    .select('email')
    .eq('username', username.toLowerCase())
    .single()

  if (error || !data) return NextResponse.json({ error: 'Username not found' }, { status: 404 })
  return NextResponse.json({ email: data.email })
}
