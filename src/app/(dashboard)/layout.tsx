export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { UserProvider } from '@/providers/UserProvider'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import type { Profile } from '@/lib/types/app.types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  if (profile.role === 'freelancer') {
    if (profile.status === 'pending') redirect('/pending-approval')
    if (profile.status === 'removed') {
      await supabase.auth.signOut()
      redirect('/login')
    }
  }

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  const notifHref = profile.role === 'admin' ? '/admin/notifications' : '/freelancer/notifications'

  return (
    <UserProvider user={profile as Profile}>
      <SidebarProvider>
        <AppSidebar
          role={profile.role as 'admin' | 'freelancer'}
          user={{
            name: profile.full_name ?? 'User',
            email: profile.email,
            avatar: profile.avatar_url ?? '',
            jobRole: profile.job_role ?? null,
            role: profile.role as 'admin' | 'freelancer',
          }}
        />
        <SidebarInset>
          <SiteHeader
            unreadCount={unreadCount ?? 0}
            notifHref={notifHref}
            userName={profile.full_name ?? 'User'}
            userAvatar={profile.avatar_url ?? ''}
          />
          <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </UserProvider>
  )
}
