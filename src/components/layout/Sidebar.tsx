'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import type { UserRole } from '@/lib/types/app.types'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Bell,
  CheckSquare,
  LogOut,
  UserCircle,
  ShieldCheck,
} from 'lucide-react'
import { useSupabase } from '@/providers/SupabaseProvider'
import { useRouter } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { href: '/admin/freelancers', label: 'Freelancers', icon: Users },
  { href: '/admin/admins/invite', label: 'Invite Admin', icon: ShieldCheck },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
]

const FREELANCER_NAV: NavItem[] = [
  { href: '/freelancer', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/freelancer/tasks', label: 'My Tasks', icon: CheckSquare },
  { href: '/freelancer/notifications', label: 'Notifications', icon: Bell },
  { href: '/freelancer/profile', label: 'Profile', icon: UserCircle },
]

export function Sidebar({ role, userName, avatarUrl }: { role: UserRole; userName: string | null; avatarUrl?: string | null }) {
  const pathname = usePathname()
  const supabase = useSupabase()
  const router = useRouter()
  const nav = role === 'admin' ? ADMIN_NAV : FREELANCER_NAV

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <aside className="flex flex-col h-full w-60 shrink-0" style={{ backgroundColor: '#1C1C1E' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#f24a49' }}>
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <span className="font-semibold text-white text-sm tracking-tight">PixelFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: 'rgba(255,255,255,0.28)' }}>
          {role === 'admin' ? 'Management' : 'Workspace'}
        </p>
        {nav.map(item => {
          const Icon = item.icon
          const isDashboard = item.href === '/admin' || item.href === '/freelancer'
          const active = pathname === item.href || (!isDashboard && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                active ? 'text-white font-medium' : 'hover:text-white'
              )}
              style={active
                ? { backgroundColor: '#f24a49' }
                : { color: 'rgba(255,255,255,0.48)' }
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t px-3 py-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold text-white shrink-0" style={{ backgroundColor: '#f24a49' }}>
            {avatarUrl
              ? <img src={avatarUrl} alt={userName ?? ''} className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName ?? 'User'}</p>
            <p className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.32)' }}>{role}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="hover:text-white transition-colors p-1 rounded"
            style={{ color: 'rgba(255,255,255,0.32)' }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
