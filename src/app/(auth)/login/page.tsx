import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

const FEATURES = [
  'Track projects easily with real-time Kanban boards',
  'Get instant notifications for task updates and assignments',
  'Stay aligned with the team and manage timelines in one place',
]

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — dark */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-12" style={{ backgroundColor: '#1C1C1E' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#f24a49' }}>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="font-semibold text-white text-sm tracking-tight">PixelFlow</span>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-3">
            Manage your work<br />with clarity
          </h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            PixelFlow is our internal workspace for managing projects, tasks, and deadlines across the Pixelplay team.
          </p>
          <ul className="space-y-3">
            {FEATURES.map(f => (
              <li key={f} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#f24a49' }} />
                <span className="text-sm text-slate-300">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-600">&copy;PixelPlay Agency 2026</p>
      </div>

      {/* Right panel — white form */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f24a49' }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="font-semibold text-slate-900 text-sm">PixelFlow</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-sm text-slate-500 mb-8">Sign in to your account</p>

          <LoginForm />

          <p className="text-center text-sm text-slate-500 mt-6">
            No account?{' '}
            <Link href="/signup" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: '#f24a49' }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
