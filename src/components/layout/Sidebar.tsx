'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import type { UserRole, FreelancerRole } from '@/lib/types/app.types'
import { FREELANCER_ROLE_LABELS } from '@/lib/types/app.types'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  LogOut,
  Settings,
  CalendarDays,
  ClipboardList,
  ListTodo,
} from 'lucide-react'
import { useSupabase } from '@/providers/SupabaseProvider'
import { useRouter } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const ADMIN_GROUPS: NavGroup[] = [
  {
    label: 'Menu',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
      { href: '/admin/workspace', label: 'Workspace', icon: Users },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/content-planner', label: 'Content Planner', icon: CalendarDays },
      { href: '/admin/discovery', label: 'Discovery', icon: ClipboardList },
    ],
  },
]

const FREELANCER_GROUPS_BASE: NavGroup[] = [
  {
    label: 'Menu',
    items: [
      { href: '/freelancer', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/freelancer/projects', label: 'Projects', icon: FolderKanban },
    ],
  },
]

// Managers are admin-tier (reuse the /admin pages) but without Workspace or
// Discovery. They also do hands-on work, so they get a personal "My Tasks" view.
const MANAGER_GROUPS: NavGroup[] = [
  {
    label: 'Menu',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
      { href: '/freelancer/tasks', label: 'My Tasks', icon: ListTodo },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/content-planner', label: 'Content Planner', icon: CalendarDays },
    ],
  },
]

export function Sidebar({ role, userName, avatarUrl, jobRole }: { role: UserRole; userName: string | null; avatarUrl?: string | null; jobRole?: FreelancerRole | null }) {
  const pathname = usePathname()
  const supabase = useSupabase()
  const router = useRouter()

  const freelancerGroups: NavGroup[] = jobRole === 'social_media_manager'
    ? [
        ...FREELANCER_GROUPS_BASE,
        { label: 'Content', items: [{ href: '/freelancer/content-planner', label: 'Content Planner', icon: CalendarDays }] },
      ]
    : FREELANCER_GROUPS_BASE

  const groups = role === 'admin' ? ADMIN_GROUPS : role === 'manager' ? MANAGER_GROUPS : freelancerGroups
  const profileHref = role === 'freelancer' ? '/freelancer/profile' : '/admin/profile'

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <aside className="flex flex-col h-full w-60 shrink-0 bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary">
          <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <span className="font-semibold text-sidebar-foreground text-sm tracking-tight">PixelFlow</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-5 overflow-y-auto">
        {groups.map(group => (
          <div key={group.label} className="space-y-0.5">
            <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-2 text-muted-foreground">
              {group.label}
            </p>
            {group.items.map(item => {
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
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
                    active
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        <Link
          href={profileHref}
          className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors group"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold bg-primary text-primary-foreground shrink-0">
            {avatarUrl
              ? <img src={avatarUrl} alt={userName ?? ''} className="w-full h-full object-cover" />
              : initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{userName ?? 'User'}</p>
            <p className="text-xs text-muted-foreground capitalize truncate">
              {role === 'manager' ? 'Manager' : jobRole ? FREELANCER_ROLE_LABELS[jobRole] : role}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href={profileHref}
            className="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-lg text-xs font-medium text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          >
            <Settings className="w-4 h-4" /> Edit profile
          </Link>
          <button
            onClick={handleSignOut}
            title="Sign out"
            aria-label="Sign out"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
