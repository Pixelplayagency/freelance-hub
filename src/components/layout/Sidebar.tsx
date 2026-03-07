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
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
]

const FREELANCER_NAV: NavItem[] = [
  { href: '/freelancer', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/freelancer/tasks', label: 'My Tasks', icon: CheckSquare },
  { href: '/freelancer/notifications', label: 'Notifications', icon: Bell },
]

export function Sidebar({ role, userName }: { role: UserRole; userName: string | null }) {
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
    <aside className="flex flex-col h-full w-60 shrink-0" style={{ backgroundColor: '#0F172A' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <span className="font-semibold text-white text-sm tracking-tight">FreelanceHub</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 px-3 mb-2">
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
                active
                  ? 'bg-indigo-500 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/8'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="border-t border-white/8 px-3 py-4">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-semibold text-white shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName ?? 'User'}</p>
            <p className="text-xs text-slate-500 capitalize">{role}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="text-slate-500 hover:text-white transition-colors p-1 rounded"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
