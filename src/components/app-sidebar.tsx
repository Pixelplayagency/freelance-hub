"use client"

import * as React from "react"
import {
  LayoutDashboardIcon,
  FolderIcon,
  UsersIcon,
  CalendarIcon,
  BellIcon,
  UserCircleIcon,
  ClipboardListIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const ADMIN_NAV = [
  { title: 'Dashboard',       url: '/admin',                    icon: LayoutDashboardIcon },
  { title: 'Projects',        url: '/admin/projects',           icon: FolderIcon },
  { title: 'Workspace',       url: '/admin/workspace',          icon: UsersIcon },
  { title: 'Content Planner', url: '/admin/content-planner',   icon: CalendarIcon },
  { title: 'Notifications',   url: '/admin/notifications',      icon: BellIcon },
  { title: 'Profile',         url: '/admin/profile',            icon: UserCircleIcon },
]

const FREELANCER_NAV_BASE = [
  { title: 'Dashboard',     url: '/freelancer',               icon: LayoutDashboardIcon },
  { title: 'Projects',      url: '/freelancer/projects',      icon: FolderIcon },
  { title: 'Tasks',         url: '/freelancer/tasks',         icon: ClipboardListIcon },
  { title: 'Notifications', url: '/freelancer/notifications', icon: BellIcon },
  { title: 'Profile',       url: '/freelancer/profile',       icon: UserCircleIcon },
]

export interface AppSidebarUser {
  name: string
  email: string
  avatar: string
  jobRole?: string | null
  role: 'admin' | 'freelancer'
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role: 'admin' | 'freelancer'
  user: AppSidebarUser
}

export function AppSidebar({ role, user, ...props }: AppSidebarProps) {
  const freelancerNav = user.jobRole === 'social_media_manager'
    ? [
        FREELANCER_NAV_BASE[0],
        { title: 'Content Planner', url: '/freelancer/content-planner', icon: CalendarIcon },
        FREELANCER_NAV_BASE[3],
        FREELANCER_NAV_BASE[4],
      ]
    : FREELANCER_NAV_BASE

  const navItems = role === 'admin' ? ADMIN_NAV : freelancerNav
  const homeHref = role === 'admin' ? '/admin' : '/freelancer'

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href={homeHref}>
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ backgroundColor: 'var(--primary)', boxShadow: '0 2px 8px oklch(0.585 0.233 13.3 / 0.4)' }}
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-base font-semibold">PixelFlow</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
