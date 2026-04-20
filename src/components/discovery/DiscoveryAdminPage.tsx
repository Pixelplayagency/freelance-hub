'use client'

import { useState, useTransition } from 'react'
import { Plus, Copy, Check, ExternalLink, Trash2, Clock, CheckCircle2, ChevronDown, ChevronUp, Link2 } from 'lucide-react'
import type { DiscoveryToken, DiscoverySubmission, DiscoveryConfig } from '@/lib/types/app.types'
import { createDiscoveryToken, deleteDiscoveryToken } from '@/lib/actions/discovery.actions'
import { DiscoveryEditor } from './DiscoveryEditor'
import { toast } from 'sonner'

interface Props {
  tokens: DiscoveryToken[]
  initialConfig: DiscoveryConfig
}

function SubmissionDetail({ s }: { s: DiscoverySubmission }) {
  const [open, setOpen] = useState(false)

  const row = (label: string, value: string | string[] | null | undefined) => {
    if (!value || (Array.isArray(value) && !value.length)) return null
    return (
      <div className="grid grid-cols-[160px_1fr] gap-3 py-2.5 border-b last:border-0" style={{ borderColor: '#f0ece6' }}>
        <span className="text-xs font-semibold uppercase tracking-wider shrink-0" style={{ color: '#8c8278' }}>{label}</span>
        <span className="text-sm" style={{ color: '#1a1714' }}>
          {Array.isArray(value) ? value.join(', ') : value}
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: '#e5e0d8' }}>
      <button className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(o => !o)}>
        <div>
          <p className="text-sm font-bold" style={{ color: '#1a1714' }}>{s.first_name} {s.last_name}</p>
          <p className="text-xs mt-0.5" style={{ color: '#8c8278' }}>
            {s.email} · {s.brand_name}{s.industry ? ` · ${s.industry}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs" style={{ color: '#8c8278' }}>
            {new Date(s.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          {open ? <ChevronUp className="w-4 h-4" style={{ color: '#8c8278' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#8c8278' }} />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1" style={{ backgroundColor: '#faf9f7' }}>
          <div className="divide-y" style={{ borderColor: '#f0ece6' }}>
            {row('Role', s.business_role)}
            {row('Contact', s.contact_number)}
            {row('Industry', s.industry)}
            {row('Description', s.business_description)}
            {row('Brand presence', s.brand_presence)}
            {row('Agency history', s.worked_with_agency)}
            {row('Start timeline', s.start_timeline)}
            {row('Instagram', s.instagram_handle)}
            {row('Facebook', s.facebook_handle)}
            {row('TikTok', s.tiktok_handle)}
            {row('Website', s.website_url)}
            {row('Support needed', s.support_types)}
            {row('Content types', s.content_types)}
            {row('Posts/month', s.posts_per_month)}
            {row('Reels/month', s.reels_per_month)}
            {row('Site visits ok', s.site_visits_ok)}
            {row('Monthly budget', s.monthly_budget)}
          </div>
        </div>
      )}
    </div>
  )
}

function TokenCard({ token, onDelete }: { token: DiscoveryToken; onDelete: (id: string) => void }) {
  const [copied, setCopied] = useState(false)
  const [deleting, startDelete] = useTransition()

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const url = `${origin}/discovery/${token.token}`

  function copy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDelete() {
    startDelete(async () => {
      await deleteDiscoveryToken(token.id)
      onDelete(token.id)
      toast.success('Link deleted')
    })
  }

  const isUsed = !!token.used_at
  const isExpired = token.expires_at ? new Date(token.expires_at) < new Date() : false

  return (
    <div className="rounded-2xl p-5 border-2 transition-all" style={{ borderColor: '#e5e0d8', backgroundColor: 'white' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isUsed ? (
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#059669' }}>
                <CheckCircle2 className="w-3 h-3" /> Submitted
              </span>
            ) : isExpired ? (
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f5f3f0', color: '#8c8278' }}>
                <Clock className="w-3 h-3" /> Expired
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(242,74,73,0.08)', color: '#f24a49' }}>
                <Link2 className="w-3 h-3" /> Active
              </span>
            )}
            {token.label && <span className="text-sm font-semibold truncate" style={{ color: '#1a1714' }}>{token.label}</span>}
          </div>
          <p className="text-xs font-mono" style={{ color: '#8c8278' }}>
            {token.token.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-xs mt-1" style={{ color: '#c0b8b0' }}>
            Created {new Date(token.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            {token.expires_at && ` · Expires ${new Date(token.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isUsed && !isExpired && (
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-lg border transition-colors hover:bg-gray-50"
              style={{ borderColor: '#e5e0d8', color: '#8c8278' }} title="Open form">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button onClick={copy} className="p-2 rounded-lg border transition-colors hover:bg-gray-50"
            style={{ borderColor: '#e5e0d8', color: copied ? '#059669' : '#8c8278' }} title="Copy link">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="p-2 rounded-lg border transition-colors hover:bg-red-50 disabled:opacity-40"
            style={{ borderColor: '#e5e0d8', color: '#f24a49' }} title="Delete link">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {isUsed && token.submission && (
        <div className="mt-4">
          <SubmissionDetail s={token.submission as DiscoverySubmission} />
        </div>
      )}
    </div>
  )
}

export function DiscoveryAdminPage({ tokens: initialTokens, initialConfig }: Props) {
  const [tokens, setTokens] = useState(initialTokens)
  const [label, setLabel] = useState('')
  const [expiry, setExpiry] = useState('')
  const [creating, startCreate] = useTransition()
  const [showCreate, setShowCreate] = useState(false)
  const [tab, setTab] = useState<'links' | 'editor'>('links')

  function handleDelete(id: string) { setTokens(t => t.filter(tk => tk.id !== id)) }

  async function handleCreate() {
    startCreate(async () => {
      const result = await createDiscoveryToken({ label: label || null, expiresAt: expiry || null })
      if (result.token) {
        setTokens(prev => [result.token!, ...prev])
        setLabel(''); setExpiry(''); setShowCreate(false)
        toast.success('Discovery link created')
      } else {
        toast.error('Failed to create link')
      }
    })
  }

  const submitted = tokens.filter(t => t.used_at)
  const active = tokens.filter(t => !t.used_at)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Client Discovery</h1>
          <p className="text-sm mt-0.5 text-muted-foreground">Generate shareable links · customise the form questions</p>
        </div>
        {tab === 'links' && (
          <button onClick={() => setShowCreate(o => !o)}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl text-white transition-colors"
            style={{ backgroundColor: '#f24a49', boxShadow: '0 4px 14px rgba(242,74,73,0.28)' }}>
            <Plus className="w-4 h-4" /> New Link
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-muted w-fit">
        {(['links', 'editor'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              backgroundColor: tab === t ? 'white' : 'transparent',
              color: tab === t ? 'var(--foreground)' : 'var(--muted-foreground)',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}>
            {t === 'links' ? 'Links & Submissions' : 'Edit Form'}
          </button>
        ))}
      </div>

      {tab === 'links' && (
        <>
          {/* Create panel */}
          {showCreate && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="text-sm font-semibold mb-4 text-foreground">Create Discovery Link</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Label <span className="normal-case font-normal">(optional)</span>
                  </label>
                  <input type="text" value={label} onChange={e => setLabel(e.target.value)}
                    placeholder="e.g. Coffee Brand — April 2026"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Expiry date <span className="normal-case font-normal">(optional)</span>
                  </label>
                  <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <button onClick={handleCreate} disabled={creating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
                  style={{ backgroundColor: '#f24a49' }}>
                  {creating ? 'Creating...' : 'Generate Link'}
                </button>
                <button onClick={() => setShowCreate(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[{ label: 'Total Links', value: tokens.length }, { label: 'Submitted', value: submitted.length }, { label: 'Awaiting', value: active.length }]
              .map(s => (
                <div key={s.label} className="bg-card border border-border rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-foreground tabular-nums">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
          </div>

          {/* Token list */}
          {tokens.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(242,74,73,0.08)' }}>
                <Link2 className="w-7 h-7" style={{ color: '#f24a49' }} />
              </div>
              <p className="text-sm font-semibold text-foreground">No discovery links yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Create a link and send it to a potential client.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tokens.map(t => <TokenCard key={t.id} token={t} onDelete={handleDelete} />)}
            </div>
          )}
        </>
      )}

      {tab === 'editor' && (
        <DiscoveryEditor initialConfig={initialConfig} />
      )}
    </div>
  )
}
