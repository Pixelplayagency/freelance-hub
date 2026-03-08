import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Bell } from 'lucide-react'

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
      .select('role, full_name')
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
    <div className="flex items-center gap-2">
      {/* Notification Bell */}
      <Link
        href={notifHref}
        className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {(unreadCount ?? 0) > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px] font-semibold text-white leading-none" style={{ backgroundColor: '#f24a49' }}>
            {(unreadCount ?? 0) > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>

      {/* User Avatar */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white select-none" style={{ backgroundColor: '#f24a49' }}>
        {initials}
      </div>
    </div>
  )
}
