import Link from 'next/link'
import Features from '@/components/features-1'

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <span className="text-base font-bold text-foreground">PixelPlay</span>
        <Link
          href="/login"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 md:py-36">
        <h1 className="text-5xl md:text-6xl font-bold text-foreground tracking-tight max-w-3xl leading-tight">
          Your freelance team,<br />all in one place
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-xl">
          Manage projects, tasks, content calendars, and your entire freelance workforce — beautifully.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Get started
          </Link>
        </div>
      </section>

      {/* Features block */}
      <Features />

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground mt-auto">
        © {new Date().getFullYear()} PixelPlay Agency. All rights reserved.
      </footer>
    </div>
  )
}
