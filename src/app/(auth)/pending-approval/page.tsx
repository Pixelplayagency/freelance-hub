export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function PendingApprovalPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('status, role')
    .eq('id', user.id)
    .single()

  // Active users shouldn't be here
  if (!profile || profile.status === 'active') redirect('/admin')
  // Removed users go to login
  if (profile.status === 'removed') redirect('/login')

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center mx-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: '#fff3f3' }}
        >
          <svg className="w-7 h-7" style={{ color: '#f24a49' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Waiting for approval</h1>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          Your account is pending review by the admin. You'll be able to access the platform once approved.
        </p>
        <p className="text-xs text-slate-400">
          Signed in as <span className="font-medium text-slate-600">{user.email}</span>
        </p>
        <form action="/api/auth/signout" method="post" className="mt-6">
          <button
            type="submit"
            className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
