'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import {
  createContentPlan, updateContentPlan, deleteContentPlan,
  approveCaption, approvePost, submitForApproval,
} from '@/lib/actions/content-plan.actions'
import {
  createScheduleEntry, updateScheduleEntry, deleteScheduleEntry,
} from '@/lib/actions/content-schedule.actions'
import type { ContentPlan, ContentPlanStatus, ContentType, MediaItem, ScheduleEntry } from '@/lib/types/app.types'
import { PlannerToolbar } from './planner/PlannerToolbar'
import { CalendarView } from './planner/CalendarView'
import { FeedPreviewGrid } from './planner/FeedPreviewGrid'
import { ScheduleView } from './planner/ScheduleView'
import { ContentSidePanel } from './planner/ContentSidePanel'
import {
  makeDraft, toDateString, getDisplayStatus, entryMediaItems,
  type EntryWithCreator, type PanelDraft, type PlannerFilters, type FilterStatus,
} from './planner/types'

const CLOUD_NAME = 'desj9wmtd'
const UPLOAD_PRESET = 'task-uploads'

export function ContentPlannerCalendar({
  entries: initialEntries, scheduleEntries: initialScheduleEntries, month, year, clientId, basePath, isAdmin,
}: {
  entries: EntryWithCreator[]
  scheduleEntries: ScheduleEntry[]
  month: number
  year: number
  clientId: string
  basePath: string
  isAdmin: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [entries, setEntries] = useState<EntryWithCreator[]>(initialEntries)
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>(initialScheduleEntries)
  const [draft, setDraft] = useState<PanelDraft | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [view, setView] = useState<'calendar' | 'preview' | 'schedule'>('calendar')
  const [viewMedia, setViewMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [filters, setFilters] = useState<PlannerFilters>({ search: '', platform: 'all', status: 'all', type: 'all' })

  // Build entry map grouped by date, supporting multiple entries per day
  const entryMap: Record<string, EntryWithCreator[]> = {}
  const filtered = entries.filter(e => {
    if (filters.search && !e.caption?.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.platform !== 'all' && !e.platforms?.includes(filters.platform)) return false
    if (filters.type !== 'all' && e.content_type !== filters.type) return false
    if (filters.status !== 'all') {
      const st = getDisplayStatus(e)
      const statusMap: Record<FilterStatus, string> = {
        all: '', scheduled: 'Scheduled', in_review: 'In review', approved: 'Approved',
        rejected: 'Rejected', published: 'Published', not_posted: 'Pending',
      }
      if (st.label !== statusMap[filters.status]) return false
    }
    return true
  })
  for (const e of filtered) {
    if (!entryMap[e.date]) entryMap[e.date] = []
    entryMap[e.date].push(e)
  }

  // Schedule entries are a separate, lightweight data set — not linked to entries above.
  const scheduleEntryMap: Record<string, ScheduleEntry[]> = {}
  for (const e of scheduleEntries) {
    if (!scheduleEntryMap[e.date]) scheduleEntryMap[e.date] = []
    scheduleEntryMap[e.date].push(e)
  }

  function openPanel(ds: string, entry?: EntryWithCreator) {
    const target = entry || entries.find(e => e.date === ds) || null
    setDraft(makeDraft(ds, target))
    setPanelOpen(true)
  }

  function handleCreateSchedule(date: string, type: ContentType) {
    startTransition(async () => {
      try {
        const created = await createScheduleEntry({ client_id: clientId, date, content_type: type })
        if (created) setScheduleEntries(prev => [...prev, created as ScheduleEntry])
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to add'
        setSaveError(msg)
        setTimeout(() => setSaveError(null), 5000)
      }
    })
  }

  function handleUpdateSchedule(id: string, patch: Partial<Pick<ScheduleEntry, 'content_type' | 'scheduled_time' | 'status'>>) {
    setScheduleEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e))
    startTransition(async () => {
      try {
        await updateScheduleEntry(id, patch)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Update failed'
        setSaveError(msg)
        setTimeout(() => setSaveError(null), 5000)
      }
    })
  }

  function handleDeleteSchedule(id: string) {
    setScheduleEntries(prev => prev.filter(e => e.id !== id))
    startTransition(async () => {
      await deleteScheduleEntry(id)
    })
  }

  const handleSave = useCallback(() => {
    if (!draft) return
    startTransition(async () => {
      const payload = {
        client_id: clientId,
        date: draft.date,
        content_type: draft.content_type,
        platforms: draft.platforms,
        scheduled_time: draft.scheduled_time || null,
        tbc: draft.tbc || null,
        caption: draft.caption || null,
        ...(isAdmin ? { client_comments: draft.client_comments || null } : {}),
        media_items: draft.media_items,
        media_url: draft.media_items[0]?.url ?? null,
        media_type: draft.media_items[0]?.type ?? null,
        status: draft.status,
      }
      try {
        if (draft.entry) {
          await updateContentPlan(draft.entry.id, payload)
          const updated = { ...draft.entry, ...payload } as EntryWithCreator
          setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
          setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
          if (!isAdmin && !draft.entry.approval_requested) {
            await submitForApproval(draft.entry.id)
            setEntries(prev => prev.map(e => e.id === updated.id ? { ...e, approval_requested: true } : e))
          }
        } else {
          const created = await createContentPlan(payload)
          if (created) {
            const newEntry = created as EntryWithCreator
            if (!isAdmin) {
              await submitForApproval(newEntry.id)
              setEntries(prev => [...prev, { ...newEntry, approval_requested: true }])
            } else {
              setEntries(prev => [...prev, newEntry])
            }
          }
        }
        setPanelOpen(false)
        setDraft(null)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Save failed'
        setSaveError(msg)
        setTimeout(() => setSaveError(null), 5000)
      }
    })
  }, [draft, clientId, isAdmin, startTransition])

  function handleDelete() {
    if (!draft?.entry) return
    const id = draft.entry.id
    startTransition(async () => {
      await deleteContentPlan(id)
      setEntries(prev => prev.filter(e => e.id !== id))
      setPanelOpen(false)
      setDraft(null)
    })
  }

  async function handleUploadMedia(files: File[]) {
    if (!draft) return
    setDraft(s => s ? { ...s, uploading: true } : s)
    const uploaded: MediaItem[] = []
    try {
      for (const file of files) {
        const isVideo = file.type.startsWith('video/')
        const fd = new FormData()
        fd.append('file', file)
        fd.append('upload_preset', UPLOAD_PRESET)
        fd.append('quality', 'auto')
        const endpoint = isVideo
          ? `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`
          : `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`
        const res = await fetch(endpoint, { method: 'POST', body: fd })
        const data = await res.json()
        if (data.secure_url) uploaded.push({ url: data.secure_url, type: isVideo ? 'video' : 'image' })
      }
      setDraft(s => s ? { ...s, media_items: [...s.media_items, ...uploaded], uploading: false } : s)
    } catch {
      setDraft(s => s ? { ...s, uploading: false } : s)
      setSaveError('Media upload failed')
      setTimeout(() => setSaveError(null), 5000)
    }
  }

  function handleSubmitForApproval() {
    if (!draft?.entry) return
    startTransition(async () => {
      await submitForApproval(draft.entry!.id)
      const updated = { ...draft.entry!, approval_requested: true }
      setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
      setDraft(s => s ? { ...s, entry: updated } : s)
    })
  }

  function handleApproveCaption() {
    if (!draft?.entry) return
    const next = !draft.entry.caption_approved
    startTransition(async () => {
      await approveCaption(draft.entry!.id, next)
      const patch = { caption_approved: next, caption_rejected: false }
      const updated = { ...draft.entry!, ...patch }
      setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
      setDraft(s => s && s.entry?.id === updated.id ? { ...s, entry: updated } : s)
    })
  }

  function handleApprovePost() {
    if (!draft?.entry) return
    const next = !draft.entry.post_approved
    startTransition(async () => {
      await approvePost(draft.entry!.id, next)
      const patch = { post_approved: next, post_rejected: false }
      const updated = { ...draft.entry!, ...patch }
      setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
      setDraft(s => s && s.entry?.id === updated.id ? { ...s, entry: updated } : s)
    })
  }

  const todayDS = toDateString(new Date())

  return (
    <div className="space-y-4">
      <PlannerToolbar
        year={year}
        month={month}
        basePath={basePath}
        filters={filters}
        onFilterChange={setFilters}
        onAddNew={() => openPanel(todayDS)}
        totalCount={entries.length}
        filteredCount={filtered.length}
        view={view}
        onViewChange={setView}
      />

      {saveError && !panelOpen && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
          <p className="text-xs text-red-700 font-medium">{saveError}</p>
        </div>
      )}

      {view === 'calendar' && (
        <CalendarView
          year={year}
          month={month}
          entryMap={entryMap}
          activeDate={draft?.date ?? null}
          onSelectEntry={entry => openPanel(entry.date, entry)}
          onAddNew={ds => openPanel(ds)}
        />
      )}
      {view === 'schedule' && (
        <ScheduleView
          year={year}
          month={month}
          entryMap={scheduleEntryMap}
          onCreate={handleCreateSchedule}
          onUpdate={handleUpdateSchedule}
          onDelete={handleDeleteSchedule}
        />
      )}
      {view === 'preview' && (
        <FeedPreviewGrid
          entries={filtered}
          activeDate={draft?.date ?? null}
          onSelectEntry={entry => openPanel(entry.date, entry)}
        />
      )}

      <ContentSidePanel
        open={panelOpen}
        onOpenChange={open => { setPanelOpen(open); if (!open) setDraft(null) }}
        draft={draft}
        onDraftChange={setDraft}
        isAdmin={isAdmin}
        isSaving={isPending}
        saveError={saveError}
        onSave={handleSave}
        onDelete={handleDelete}
        onUploadMedia={handleUploadMedia}
        onSubmitForApproval={handleSubmitForApproval}
        onApproveCaption={handleApproveCaption}
        onApprovePost={handleApprovePost}
        onViewMedia={item => setViewMedia(item)}
      />

      {/* Media lightbox */}
      {viewMedia && (
        <div data-lightbox className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/85" onClick={() => setViewMedia(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewMedia(null)} className="absolute -top-9 right-0 text-white/60 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            {viewMedia.type === 'video'
              ? <video src={viewMedia.url} className="w-full max-h-[80vh] rounded-xl object-contain" controls autoPlay />
              : <img src={viewMedia.url} alt="" className="w-full max-h-[80vh] rounded-xl object-contain" />}
          </div>
        </div>
      )}
    </div>
  )
}
