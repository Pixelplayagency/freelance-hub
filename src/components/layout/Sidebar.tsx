'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import type { UserRole, FreelancerRole } from '@/lib/types/app.types'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Bell,
  CheckSquare,
  LogOut,
  UserCircle,
  CalendarDays,
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
  { href: '/admin/workspace', label: 'Workspace', icon: Users },
  { href: '/admin/content-planner', label: 'Content Planner', icon: CalendarDays },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/profile', label: 'Profile', icon: UserCircle },
]

const FREELANCER_NAV_BASE: NavItem[] = [
  { href: '/freelancer', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/freelancer/tasks', label: 'My Tasks', icon: CheckSquare },
  { href: '/freelancer/notifications', label: 'Notifications', icon: Bell },
  { href: '/freelancer/profile', label: 'Profile', icon: UserCircle },
]

export function Sidebar({ role, userName, avatarUrl, jobRole }: { role: UserRole; userName: string | null; avatarUrl?: string | null; jobRole?: FreelancerRole | null }) {
  const pathname = usePathname()
  const supabase = useSupabase()
  const router = useRouter()

  const freelancerNav = jobRole === 'social_media_manager'
    ? [
        FREELANCER_NAV_BASE[0],
        FREELANCER_NAV_BASE[1],
        { href: '/freelancer/content-planner', label: 'Content Planner', icon: CalendarDays },
        FREELANCER_NAV_BASE[2],
        FREELANCER_NAV_BASE[3],
      ]
    : FREELANCER_NAV_BASE

  const nav = role === 'admin' ? ADMIN_NAV : freelancerNav

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
      <div
        className="flex items-center gap-3 px-5 py-5 border-b"
        style={{
          borderColor: 'rgba(255,255,255,0.07)',
          background: 'linear-gradient(180deg, rgba(242,74,73,0.08) 0%, transparent 100%)',
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#f24a49', boxShadow: '0 2px 8px rgba(242,74,73,0.4)' }}
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <span className="font-semibold text-white text-sm tracking-tight">PixelFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {role === 'admin' ? 'Management' : 'Workspace'}
        </p>
        {nav.map(item => {
          const Icon = item.icon
          const isDashboard = item.href === '/admin' || item.href === '/freelancer'
          const active = pathname === item.href
            || (!isDashboard && pathname.startsWith(item.href + '/'))
            || (item.href === '/admin/workspace' && (pathname.startsWith('/admin/freelancers') || pathname.startsWith('/admin/admins')))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                active
                  ? 'text-white font-medium'
                  : 'hover:text-white hover:bg-white/5'
              )}
              style={active
                ? { backgroundColor: '#f24a49', boxShadow: '0 2px 8px rgba(242,74,73,0.35)' }
                : { color: 'rgba(255,255,255,0.52)' }
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
            <p className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.45)' }}>{role}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="p-1.5 rounded-md hover:bg-white/5 transition-colors"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
