'use client'

import { useEffect, useState } from 'react'
import { Clock, UserPlus, Users, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InviteFreelancerForm } from '@/components/auth/InviteFreelancerForm'
import { FreelancerCardActions } from '@/components/admin/FreelancerCardActions'
import { cn } from '@/lib/utils/cn'
import type { Profile, FreelancerRole } from '@/lib/types/app.types'
import { FREELANCER_ROLE_LABELS } from '@/lib/types/app.types'
import { assignJobRole } from '@/lib/actions/freelancer.actions'
import { createBrowserClient } from '@supabase/ssr'

type Tab = 'members' | 'invite'
type InviteRole = 'freelancer' | 'admin'

function getInitials(profile: Profile) {
  return profile.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : profile.email[0].toUpperCase()
}

export default function WorkspacePage() {
  const [tab, setTab] = useState<Tab>('members')
  const [inviteRole, setInviteRole] = useState<InviteRole>('freelancer')
  const [pending, setPending] = useState<Profile[]>([])
  const [active, setActive] = useState<Profile[]>([])
  const [countMap, setCountMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    async function load() {
      const [{ data: freelancers }, { data: taskCounts }] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'freelancer').in('status', ['pending', 'active']).order('full_name'),
        supabase.from('tasks').select('assigned_to, status').neq('status', 'completed'),
      ])
      const map = ((taskCounts ?? []) as { assigned_to: string | null }[]).reduce<Record<string, number>>((acc, t) => {
        if (t.assigned_to) acc[t.assigned_to] = (acc[t.assigned_to] ?? 0) + 1
        return acc
      }, {})
      setCountMap(map)
      setPending(((freelancers ?? []) as Profile[]).filter(f => f.status === 'pending'))
      setActive(((freelancers ?? []) as Profile[]).filter(f => f.status === 'active'))
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workspace</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {active.length} active · {pending.length} pending approval
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit mb-6">
        {([['members', 'Members'], ['invite', 'Invite']] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
              tab === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {tab === 'members' && (
        <div>
          {loading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Loading…</div>
          ) : (
            <>
              {/* Pending */}
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

              {/* Active */}
              {active.length === 0 && pending.length === 0 ? (
                <div className="bg-card rounded-lg border border-border flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 accent-tint">
                    <UserPlus className="w-6 h-6" style={{ color: '#f24a49' }} />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">No freelancers yet</p>
                  <p className="text-xs text-muted-foreground mb-5">Invite freelancers to assign tasks to them</p>
                  <Button onClick={() => setTab('invite')} className="text-white shadow-sm" style={{ backgroundColor: '#f24a49' }}>
                    Invite your first freelancer
                  </Button>
                </div>
              ) : active.length > 0 ? (
                <div>
                  {pending.length > 0 && (
                    <h2 className="text-sm font-semibold text-muted-foreground mb-3">Active ({active.length})</h2>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {active.map(profile => (
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
                            <div className="text-sm font-bold text-foreground">{countMap[profile.id] ?? 0}</div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">tasks</div>
                          </div>
                        </div>
                        {/* Job role selector */}
                        <div className="mt-3">
                          <select
                            defaultValue={profile.job_role ?? ''}
                            onChange={async (e) => {
                              const val = e.target.value as FreelancerRole | ''
                              await assignJobRole(profile.id, val === '' ? null : val)
                            }}
                            className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-[#f24a49]"
                          >
                            <option value="">No role assigned</option>
                            {(Object.entries(FREELANCER_ROLE_LABELS) as [FreelancerRole, string][]).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        </div>
                        <FreelancerCardActions id={profile.id} mode="active" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}

      {/* Invite tab */}
      {tab === 'invite' && (
        <div className="max-w-md">
          {/* Role sub-tabs */}
          <div className="flex gap-3 mb-6">
            {([['freelancer', 'Freelancer', Users], ['admin', 'Admin', ShieldCheck]] as [InviteRole, string, React.ElementType][]).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setInviteRole(id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
                  inviteRole === id
                    ? 'border-[#f24a49] bg-[#f24a49]/10 text-[#f24a49]'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="bg-card rounded-lg border border-border p-5">
            <h2 className="text-sm font-semibold text-foreground mb-1">
              Invite {inviteRole === 'admin' ? 'an Admin' : 'a Freelancer'}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              {inviteRole === 'admin'
                ? 'Admins have full access to manage projects, tasks, and freelancers.'
                : 'Freelancers can view and complete tasks assigned to them.'}
            </p>
            <InviteFreelancerForm key={inviteRole} role={inviteRole} />
          </div>
        </div>
      )}
    </div>
  )
}
