import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ThemeToggle } from './ThemeToggle'
import { NotificationBell } from './NotificationBell'
import type { Notification } from '@/lib/types/app.types'

export async function TopBar() {
  const supabase = await createSupabaseServerClient()
  // Session already validated in (dashboard)/layout.tsx — read it from the cookie (no network call).
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  if (!user) return null

  const [{ data: notifications }, { data: profile }] = await Promise.all([
    supabase
      .from('notifications')
      .select('*, task:tasks(id, title)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('profiles')
      .select('role, full_name, avatar_url')
      .eq('id', user.id)
      .single(),
  ])

  const notifHref = profile?.role === 'freelancer'
    ? '/freelancer/notifications'
    : '/admin/notifications'

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="flex items-center gap-1">
      {/* Theme toggle */}
      <ThemeToggle />

      {/* Notification bell — opens a popover */}
      <NotificationBell
        notifications={(notifications ?? []) as Notification[]}
        viewAllHref={notifHref}
      />

      {/* User Avatar */}
      <div
        className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold text-primary-foreground select-none shrink-0 ml-1 bg-primary"
        style={{ boxShadow: '0 0 0 2px color-mix(in oklch, var(--color-primary) 25%, transparent), 0 0 0 3px var(--color-background)' }}
      >
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt={profile.full_name ?? ''} className="w-full h-full object-cover" />
          : initials}
      </div>
    </div>
  )
}
