import { InviteFreelancerForm } from '@/components/auth/InviteFreelancerForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function InviteAdminPage() {
  return (
    <div className="max-w-md">
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/admin"
          className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-foreground mb-6">Invite admin</h1>
      <div className="bg-card rounded-xl border border-border p-6">
        <p className="text-sm text-muted-foreground mb-5">
          Send an invitation link to a new admin. They will create their own account and have full admin access.
        </p>
        <InviteFreelancerForm role="admin" />
      </div>
    </div>
  )
}
