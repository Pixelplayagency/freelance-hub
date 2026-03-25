export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Outfit, DM_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import { SupabaseProvider } from '@/providers/SupabaseProvider'
import { ThemeProvider } from 'next-themes'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PixelFlow — Task Management',
  description: 'Manage freelancer projects and tasks with clarity and speed.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${dmSans.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <SupabaseProvider>
            {children}
          </SupabaseProvider>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
