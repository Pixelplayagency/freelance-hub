import { InviteFreelancerForm } from '@/components/auth/InviteFreelancerForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function InviteFreelancerPage() {
  return (
    <div className="max-w-md">
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/admin/freelancers"
          className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Freelancers
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Invite freelancer</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <p className="text-sm text-gray-500 mb-5">
          Send an invitation email. The freelancer will receive a link to create their account.
        </p>
        <InviteFreelancerForm />
      </div>
    </div>
  )
}
