import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotificationList } from '@/components/dashboard/NotificationList'
import type { Notification } from '@/lib/types/app.types'

export default async function FreelancerNotificationsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*, task:tasks(id, title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground mb-6">Notifications</h1>
      <NotificationList
        notifications={(notifications ?? []) as Notification[]}
        role="freelancer"
      />
    </div>
  )
}
