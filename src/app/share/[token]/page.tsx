import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Instagram, Facebook } from 'lucide-react'
import { isShareLinkUnlocked } from '@/lib/actions/content-share.actions'
import { SharePasswordGate } from '@/components/share/SharePasswordGate'
import { ShareNotes } from '@/components/share/ShareNotes'
import { ShareCalendar } from '@/components/share/ShareCalendar'
import type { EntryWithCreator } from '@/components/content-planner/planner/types'
import type { ContentShareNote } from '@/lib/types/app.types'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.2 8.2 0 004.79 1.53V6.82a4.85 4.85 0 01-1.02-.13z" />
    </svg>
  )
}

export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const { token } = await params
  const sp = await searchParams
  const supabase = createSupabaseServiceClient()

  const { data: link } = await supabase
    .from('content_share_links')
    .select('id, client_id, password, revoked_at')
    .eq('token', token)
    .single()

  if (!link || link.revoked_at) return notFound()

  const { data: client } = await supabase.from('content_clients').select('*').eq('id', link.client_id).single()
  if (!client) return notFound()

  const unlocked = link.password ? await isShareLinkUnlocked(token) : true
  if (!unlocked) {
    return <SharePasswordGate token={token} clientName={client.name} />
  }

  const now = new Date()
  const month = sp.month !== undefined ? parseInt(sp.month) : now.getMonth()
  const year = sp.year !== undefined ? parseInt(sp.year) : now.getFullYear()
  const startDate = new Date(year, month, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

  const [{ data: entries }, { data: notes }] = await Promise.all([
    supabase.from('content_plans').select('*').eq('client_id', link.client_id).gte('date', startDate).lte('date', endDate).order('date'),
    supabase.from('content_share_notes').select('*').eq('share_link_id', link.id).order('created_at', { ascending: false }),
  ])

  const entryMap: Record<string, EntryWithCreator[]> = {}
  for (const e of (entries ?? []) as EntryWithCreator[]) {
    if (!entryMap[e.date]) entryMap[e.date] = []
    entryMap[e.date].push(e)
  }

  const hasSocials = client.instagram_url || client.facebook_url || client.tiktok_url

  let prevM = month - 1, prevY = year
  if (prevM < 0) { prevM = 11; prevY-- }
  let nextM = month + 1, nextY = year
  if (nextM > 11) { nextM = 0; nextY++ }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10 space-y-5">
      {/* Client header */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, var(--primary) 0%, color-mix(in oklch, var(--primary), transparent 65%) 100%)' }} />
        <div className="flex items-center gap-3 px-4 sm:px-5 py-4 flex-wrap">
          {client.avatar_url ? (
            <img src={client.avatar_url} alt="" className="w-11 h-11 rounded-xl object-cover border border-border shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0" style={{ background: client.color }}>
              {client.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-foreground leading-tight truncate">{client.name}</h1>
            {hasSocials && (
              <div className="flex items-center gap-1 mt-1">
                {client.instagram_url && (
                  <a href={client.instagram_url} target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                    <Instagram className="w-3.5 h-3.5" />
                  </a>
                )}
                {client.facebook_url && (
                  <a href={client.facebook_url} target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                    <Facebook className="w-3.5 h-3.5" />
                  </a>
                )}
                {client.tiktok_url && (
                  <a href={client.tiktok_url} target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                    <TikTokIcon className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}
          </div>
          <span className="ml-auto text-xs text-muted-foreground shrink-0">View-only content calendar</span>
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center gap-2">
        <Link href={`/share/${token}?month=${prevM}&year=${prevY}`} className="w-8 h-8 rounded-lg border border-border bg-card hover:bg-muted transition-colors flex items-center justify-center" aria-label="Previous month">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <Link href={`/share/${token}?month=${nextM}&year=${nextY}`} className="w-8 h-8 rounded-lg border border-border bg-card hover:bg-muted transition-colors flex items-center justify-center" aria-label="Next month">
          <ChevronRight className="w-4 h-4" />
        </Link>
        <h2 className="text-base font-bold tracking-tight text-foreground tabular-nums ml-1">
          {MONTH_NAMES[month]} <span className="text-muted-foreground font-medium">{year}</span>
        </h2>
      </div>

      <ShareCalendar year={year} month={month} entryMap={entryMap} />

      <ShareNotes shareLinkId={link.id} notes={(notes ?? []) as ContentShareNote[]} />
    </div>
  )
}
