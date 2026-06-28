'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, ClipboardList, Pencil, Clock } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { markNotificationRead, markAllNotificationsRead } from '@/lib/actions/notification.actions'
import { formatRelative } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import type { Notification } from '@/lib/types/app.types'

const TYPE_META: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  task_assigned: { icon: ClipboardList, bg: 'bg-primary/10', color: 'text-primary' },
  task_updated: { icon: Pencil, bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400' },
  task_due_soon: { icon: Clock, bg: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
}

export function NotificationBell({
  notifications,
  viewAllHref,
}: {
  notifications: Notification[]
  viewAllHref: string
}) {
  const [items, setItems] = useState(notifications)
  const [, startTransition] = useTransition()
  const unread = items.filter(n => !n.read).length

  function markRead(id: string) {
    setItems(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
    startTransition(() => markNotificationRead(id))
  }
  function markAll() {
    setItems(prev => prev.map(n => ({ ...n, read: true })))
    startTransition(() => markAllNotificationsRead())
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
          className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground leading-none">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-80 p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unread > 0 && (
            <button onClick={markAll} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-8 h-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">You&apos;re all caught up</p>
            </div>
          ) : (
            items.map(n => {
              const meta = TYPE_META[n.type] ?? TYPE_META.task_assigned
              const Icon = meta.icon
              return (
                <button
                  key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  className={cn(
                    'w-full text-left flex items-start gap-3 px-4 py-3 border-b border-border/60 transition-colors',
                    n.read ? 'opacity-60' : 'bg-primary/[0.04] hover:bg-primary/[0.08] cursor-pointer'
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', meta.bg)}>
                    <Icon className={cn('w-4 h-4', meta.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm leading-snug', n.read ? 'text-muted-foreground' : 'text-foreground font-medium')}>
                      {n.message}
                    </p>
                    {n.task && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {(n.task as { title: string }).title}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-1">{formatRelative(n.created_at)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                </button>
              )
            })
          )}
        </div>

        <div className="border-t border-border p-2">
          <Link
            href={viewAllHref}
            className="block text-center text-xs font-medium text-muted-foreground hover:text-foreground py-1.5 rounded-md hover:bg-muted transition-colors"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
