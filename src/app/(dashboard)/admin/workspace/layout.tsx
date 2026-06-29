import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Workspace (member management) is admin-only. Managers and freelancers
// are bounced to their own home so they can't reach member controls.
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    redirect(profile?.role === 'freelancer' ? '/freelancer' : '/admin')
  }

  return <>{children}</>
}
