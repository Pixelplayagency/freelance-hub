import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Clock, UserPlus } from 'lucide-react'
import { FreelancerCardActions } from '@/components/admin/FreelancerCardActions'
import type { Profile } from '@/lib/types/app.types'

export default async function FreelancersPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: freelancers }, { data: taskCounts }] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'freelancer')
      .in('status', ['pending', 'active'])
      .order('full_name'),
    supabase
      .from('tasks')
      .select('assigned_to, status')
      .neq('status', 'completed'),
  ])

  const countMap = (taskCounts ?? []).reduce<Record<string, number>>((acc, t) => {
    if (t.assigned_to) acc[t.assigned_to] = (acc[t.assigned_to] ?? 0) + 1
    return acc
  }, {})

  const pending = (freelancers ?? []).filter(f => f.status === 'pending') as Profile[]
  const active = (freelancers ?? []).filter(f => f.status === 'active') as Profile[]

  function getInitials(profile: Profile) {
    return profile.full_name
      ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
      : profile.email[0].toUpperCase()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Freelancers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {active.length} active · {pending.length} pending approval
          </p>
        </div>
        <Button asChild className="text-white shadow-sm" style={{ backgroundColor: '#f24a49' }}>
          <Link href="/admin/freelancers/invite">
            <UserPlus className="w-4 h-4 mr-1.5" />
            Invite
          </Link>
        </Button>
      </div>

      {/* Pending approval section */}
      {pending.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-amber-700">Pending Approval ({pending.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pending.map(profile => (
              <div key={profile.id} className="bg-card rounded-lg border border-amber-200 p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0 bg-amber-400">
                    {getInitials(profile)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{profile.full_name ?? 'Unnamed'}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Awaiting approval
                    </span>
                  </div>
                </div>
                <FreelancerCardActions id={profile.id} mode="pending" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active freelancers section */}
      {active.length === 0 && pending.length === 0 ? (
        <div className="bg-card rounded-lg border border-border flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 accent-tint">
            <UserPlus className="w-6 h-6" style={{ color: '#f24a49' }} />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">No freelancers yet</p>
          <p className="text-xs text-muted-foreground mb-5">Invite freelancers to assign tasks to them</p>
          <Button asChild className="text-white shadow-sm" style={{ backgroundColor: '#f24a49' }}>
            <Link href="/admin/freelancers/invite">Invite your first freelancer</Link>
          </Button>
        </div>
      ) : active.length > 0 ? (
        <div>
          {pending.length > 0 && (
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">Active ({active.length})</h2>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map(profile => {
              const activeTasks = countMap[profile.id] ?? 0
              return (
                <div key={profile.id} className="bg-card rounded-lg border border-border p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0" style={{ backgroundColor: '#f24a49' }}>
                      {getInitials(profile)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{profile.full_name ?? 'Unnamed'}</p>
                      <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                    </div>
                    <div className="shrink-0 text-center">
                      <div className="text-sm font-bold text-foreground">{activeTasks}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">tasks</div>
                    </div>
                  </div>
                  <FreelancerCardActions id={profile.id} mode="active" />
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
