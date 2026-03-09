import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from '@/components/freelancer/ProfileForm'

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-xl font-bold text-slate-900 mb-1">Profile</h1>
      <p className="text-sm text-slate-500 mb-8">Update your name and profile picture</p>
      <ProfileForm profile={profile} />
    </div>
  )
}
