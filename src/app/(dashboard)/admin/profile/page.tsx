import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/freelancer/ProfileForm'

export default async function AdminProfilePage() {
  const supabase = await createSupabaseServerClient()
  // Session already validated in (dashboard)/layout.tsx — read it from the cookie (no network call).
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-foreground mb-1">Profile</h1>
      <p className="text-sm text-muted-foreground mb-8">Update your name and profile picture</p>
      <ProfileForm profile={profile} />
    </div>
  )
}
