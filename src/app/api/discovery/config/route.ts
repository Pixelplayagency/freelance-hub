import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient, createSupabaseServerClient } from '@/lib/supabase/server'
import { DEFAULT_DISCOVERY_CONFIG } from '@/lib/types/app.types'

export async function GET() {
  const supabase = createSupabaseServiceClient()
  const { data } = await supabase
    .from('discovery_config')
    .select('config')
    .eq('id', 1)
    .single()

  return NextResponse.json(data?.config ?? DEFAULT_DISCOVERY_CONFIG)
}

export async function PUT(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const config = await req.json()
  const serviceClient = createSupabaseServiceClient()

  const { error } = await serviceClient
    .from('discovery_config')
    .upsert({ id: 1, config, updated_at: new Date().toISOString() })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
