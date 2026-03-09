import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  try {
    const { fullName, avatarUrl } = await request.json()

    if (!fullName?.trim()) return NextResponse.json({ error: 'Full name is required' }, { status: 400 })

    const sessionClient = await createSupabaseServerClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = createSupabaseServiceClient()

    const { error } = await serviceClient
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}),
      })
      .eq('id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
