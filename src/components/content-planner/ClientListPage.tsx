'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, CalendarDays, Loader2 } from 'lucide-react'
import { createContentClient, deleteContentClient } from '@/lib/actions/content-plan.actions'
import type { ContentClient } from '@/lib/types/app.types'

export function ClientListPage({ clients: initial, isAdmin }: { clients: ContentClient[]; isAdmin: boolean }) {
  const router = useRouter()
  const [clients, setClients] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const basePath = isAdmin ? '/admin/content-planner' : '/freelancer/content-planner'

  function handleCreate() {
    if (!newName.trim()) return
    startTransition(async () => {
      await createContentClient(newName.trim())
      setNewName('')
      setAdding(false)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteContentClient(id)
      setClients(prev => prev.filter(c => c.id !== id))
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Planner</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Select a client to view or manage their content calendar</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-sm font-medium text-white px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: '#f24a49' }}
          >
            <Plus className="w-4 h-4" /> Add Client
          </button>
        )}
      </div>

      {/* Add client inline form */}
      {adding && (
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 max-w-sm">
          <input
            autoFocus
            type="text"
            placeholder="Client / brand name…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setAdding(false) }}
            className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-[#f24a49]"
          />
          <button
            onClick={handleCreate}
            disabled={isPending || !newName.trim()}
            className="text-xs text-white px-3 py-2 rounded-lg disabled:opacity-50 transition-colors"
            style={{ backgroundColor: '#f24a49' }}
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create'}
          </button>
          <button onClick={() => setAdding(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
        </div>
      )}

      {/* Client grid */}
      {clients.length === 0 ? (
        <div className="bg-card border border-border rounded-xl flex flex-col items-center justify-center py-20 text-center">
          <CalendarDays className="w-10 h-10 text-slate-200 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No clients yet</p>
          {isAdmin && (
            <p className="text-xs text-muted-foreground mt-1">Click "Add Client" to create your first content planner</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(client => (
            <div key={client.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow group">
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => router.push(`${basePath}/${client.id}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#f24a4922' }}>
                    <CalendarDays className="w-5 h-5" style={{ color: '#f24a49' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate group-hover:text-[#f24a49] transition-colors">{client.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(client.id)}
                    disabled={isPending}
                    className="shrink-0 p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
