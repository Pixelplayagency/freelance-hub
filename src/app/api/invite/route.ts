import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Use session client to verify requester is admin
    const sessionClient = await createSupabaseServerClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await sessionClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const role = body.role === 'admin' ? 'admin' : 'freelancer'

    // Use service client to insert token (bypasses RLS)
    const serviceClient = createSupabaseServiceClient()

    const { data, error } = await serviceClient
      .from('invite_tokens')
      .insert({ created_by: user.id, role })
      .select('token')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const link = `${siteUrl}/join/${data.token}`

    return NextResponse.json({ success: true, link })
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
