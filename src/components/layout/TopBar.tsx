import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Bell } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export async function TopBar() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [{ count: unreadCount }, { data: profile }] = await Promise.all([
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false),
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

      {/* Notification Bell */}
      <Link
        href={notifHref}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        <Bell className="w-5 h-5" />
        {(unreadCount ?? 0) > 0 && (
          <span
            className="absolute top-1 right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px] font-semibold text-white leading-none"
            style={{ backgroundColor: 'var(--primary)', boxShadow: '0 0 0 2px oklch(0.585 0.233 13.3 / 0.25)' }}
          >
            {(unreadCount ?? 0) > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>

      {/* User Avatar */}
      <div
        className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold text-white select-none shrink-0 ml-1"
        style={{
          backgroundColor: 'var(--primary)',
          boxShadow: '0 0 0 2px oklch(0.585 0.233 13.3 / 0.25), 0 0 0 3px var(--color-background)',
        }}
      >
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt={profile.full_name ?? ''} className="w-full h-full object-cover" />
          : initials}
      </div>
    </div>
  )
}
