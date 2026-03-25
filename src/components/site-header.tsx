"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

const PAGE_NAMES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/projects': 'Projects',
  '/admin/workspace': 'Workspace',
  '/admin/content-planner': 'Content Planner',
  '/admin/notifications': 'Notifications',
  '/admin/profile': 'Profile',
  '/freelancer': 'Dashboard',
  '/freelancer/projects': 'Projects',
  '/freelancer/tasks': 'Tasks',
  '/freelancer/content-planner': 'Content Planner',
  '/freelancer/notifications': 'Notifications',
  '/freelancer/profile': 'Profile',
}

export function SiteHeader({
  unreadCount,
  notifHref,
  userName,
  userAvatar,
}: {
  unreadCount: number
  notifHref: string
  userName: string
  userAvatar: string
}) {
  const pathname = usePathname()

  const pageName =
    Object.entries(PAGE_NAMES)
      .filter(([key]) => pathname === key || pathname.startsWith(key + '/'))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? 'Dashboard'

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mx-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{pageName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <Link
          href={notifHref}
          className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span
              className="absolute top-1 right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px] font-semibold text-white leading-none"
              style={{ backgroundColor: 'var(--primary)', boxShadow: '0 0 0 2px oklch(0.585 0.233 13.3 / 0.25)' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        <div
          className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold text-white select-none shrink-0 ml-1"
          style={{ backgroundColor: 'var(--primary)', boxShadow: '0 0 0 2px oklch(0.585 0.233 13.3 / 0.25)' }}
        >
          {userAvatar
            ? <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
            : initials}
        </div>
      </div>
    </header>
  )
}
