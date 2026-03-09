export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { MobileNav } from '@/components/layout/MobileNav'
import { UserProvider } from '@/providers/UserProvider'
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

  // Block pending and removed freelancers from the dashboard
  if (profile.role === 'freelancer') {
    if (profile.status === 'pending') redirect('/pending-approval')
    if (profile.status === 'removed') {
      // Sign out first to prevent redirect loop (middleware would send them back here)
      await supabase.auth.signOut()
      redirect('/login')
    }
  }

  return (
    <UserProvider user={profile as Profile}>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F5F5F5' }}>
        {/* Desktop sidebar */}
        <div className="hidden lg:flex">
          <Sidebar role={profile.role as 'admin' | 'freelancer'} userName={profile.full_name} />
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* TopBar with mobile hamburger */}
          <div className="flex items-center h-14 border-b border-slate-200 bg-white shrink-0 px-4 gap-3 shadow-sm">
            <MobileNav role={profile.role as 'admin' | 'freelancer'} userName={profile.full_name} />
            <div className="flex-1" />
            <TopBar />
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </UserProvider>
  )
}
