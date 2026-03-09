import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { token, email, fullName, username, password, avatarUrl } = await request.json()

    if (!token || !email || !fullName || !username || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const serviceClient = createSupabaseServiceClient()

    // Validate token
    const { data: invite, error: tokenError } = await serviceClient
      .from('invite_tokens')
      .select('id, used_at, expires_at, role')
      .eq('token', token)
      .single()

    if (tokenError || !invite) {
      return NextResponse.json({ error: 'Invalid invite link' }, { status: 400 })
    }
    if (invite.used_at) {
      return NextResponse.json({ error: 'This invite link has already been used' }, { status: 400 })
    }
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invite link has expired' }, { status: 400 })
    }

    // Check username uniqueness
    const { data: existingUsername } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .single()

    if (existingUsername) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 })
    }

    const role = invite.role ?? 'freelancer'

    // Create auth user
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, status: 'active' },
    })

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    // Update profile (trigger already created it)
    const { error: profileError } = await serviceClient
      .from('profiles')
      .update({
        full_name: fullName,
        username: username.toLowerCase(),
        avatar_url: avatarUrl ?? null,
        role,
        status: 'active',
      })
      .eq('id', authData.user.id)

    if (profileError) {
      // Cleanup auth user if profile update fails
      await serviceClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    // Mark token as used
    await serviceClient
      .from('invite_tokens')
      .update({ used_at: new Date().toISOString(), used_by: authData.user.id })
      .eq('id', invite.id)

    return NextResponse.json({ success: true, role })
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
