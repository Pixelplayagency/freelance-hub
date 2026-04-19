import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const slot = formData.get('slot') as string | null // 'cover' | 'profile'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `discovery/${slot ?? 'image'}-${Date.now()}.${ext}`

  const serviceClient = createSupabaseServiceClient()
  const { error } = await serviceClient.storage
    .from('discovery-images')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = serviceClient.storage
    .from('discovery-images')
    .getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
