import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ThemeToggle } from './ThemeToggle'
import { NotificationBell } from './NotificationBell'
import type { Notification } from '@/lib/types/app.types'

export async function TopBar() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

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

  const notifHref = profile?.role === 'admin'
    ? '/admin/notifications'
    : '/freelancer/notifications'

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
        style={{ boxShadow: '0 0 0 2px oklch(0.585 0.233 13.3 / 0.25), 0 0 0 3px var(--color-background)' }}
      >
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt={profile.full_name ?? ''} className="w-full h-full object-cover" />
          : initials}
      </div>
    </div>
  )
}
