'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/providers/SupabaseProvider'
import { toast } from 'sonner'
import type { Notification } from '@/lib/types/app.types'

export function useNotifications(userId: string, initialCount: number) {
  const supabase = useSupabase()
  const [unreadCount, setUnreadCount] = useState(initialCount)

  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notif = payload.new as Notification
          setUnreadCount(prev => prev + 1)
          toast.info(notif.message)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  return { unreadCount, setUnreadCount }
}
