import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { fullName, username, avatarUrl } = await request.json()

    if (!fullName?.trim()) return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    if (!username?.trim()) return NextResponse.json({ error: 'Username is required' }, { status: 400 })

    // Verify the requester is authenticated
    const sessionClient = await createSupabaseServerClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = createSupabaseServiceClient()

    // Check username is not already taken
    const { data: existing } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('username', username.trim().toLowerCase())
      .neq('id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })
    }

    // Update the profile
    const { error } = await serviceClient
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        avatar_url: avatarUrl ?? null,
      })
      .eq('id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
