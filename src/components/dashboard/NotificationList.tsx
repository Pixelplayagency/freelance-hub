'use client'

import { useState, useTransition } from 'react'
import { markNotificationRead, markAllNotificationsRead } from '@/lib/actions/notification.actions'
import { formatRelative } from '@/lib/utils/date'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Bell, CheckCheck, ClipboardList, Pencil, Clock } from 'lucide-react'
import type { Notification } from '@/lib/types/app.types'

const TYPE_META: Record<Notification['type'], { icon: React.ElementType; bg: string; color: string }> = {
  task_assigned: { icon: ClipboardList, bg: 'accent-tint', color: 'text-primary' },
  task_updated: { icon: Pencil, bg: 'bg-blue-100', color: 'text-blue-600' },
  task_due_soon: { icon: Clock, bg: 'bg-amber-100', color: 'text-amber-600' },
}

export function NotificationList({
  notifications,
  role,
}: {
  notifications: Notification[]
  role: 'admin' | 'freelancer'
}) {
  const [localNotifs, setLocalNotifs] = useState(notifications)
  const [isPending, startTransition] = useTransition()

  function handleMarkRead(id: string) {
    setLocalNotifs(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    startTransition(() => markNotificationRead(id))
  }

  function handleMarkAll() {
    setLocalNotifs(prev => prev.map(n => ({ ...n, read: true })))
    startTransition(() => markAllNotificationsRead())
  }

  const unread = localNotifs.filter(n => !n.read).length

  return (
    <div className="space-y-3">
      {unread > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{unread} unread</span>
          <Button size="sm" variant="ghost" onClick={handleMarkAll} disabled={isPending} className="text-muted-foreground hover:text-foreground">
            <CheckCheck className="w-4 h-4 mr-1.5" />
            Mark all read
          </Button>
        </div>
      )}

      {localNotifs.length === 0 ? (
        <div className="bg-card rounded-lg border border-border flex flex-col items-center justify-center py-20 text-center">
          <Bell className="w-10 h-10 text-muted mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No notifications yet</p>
          <p className="text-xs text-muted-foreground mt-1">You&apos;re all caught up</p>
        </div>
      ) : (
        <div className="space-y-2">
          {localNotifs.map(notif => {
            const meta = TYPE_META[notif.type]
            const Icon = meta.icon
            return (
              <div
                key={notif.id}
                onClick={() => !notif.read && handleMarkRead(notif.id)}
                className={cn(
                  'flex items-start gap-3.5 p-4 rounded-xl border shadow-sm transition-all',
                  notif.read
                    ? 'bg-card border-border opacity-60'
                    : 'accent-tint border-primary/20 cursor-pointer hover:border-primary/40 hover:shadow-sm'
                )}
              >
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', meta.bg)}>
                  <Icon className={cn('w-4 h-4', meta.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm leading-snug', notif.read ? 'text-muted-foreground' : 'text-foreground font-semibold')}>
                    {notif.message}
                  </p>
                  {notif.task && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {(notif.task as { title: string }).title}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{formatRelative(notif.created_at)}</p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: 'var(--primary)' }} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
