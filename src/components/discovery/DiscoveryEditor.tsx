'use client'

import { useState, useTransition, useId } from 'react'
import { Plus, Trash2, GripVertical, Eye, Save, RotateCcw, ChevronDown, ChevronUp, Monitor, Smartphone, Upload, X } from 'lucide-react'
import type { DiscoveryConfig, DiscoveryQuestion, DiscoveryQuestionType } from '@/lib/types/app.types'
import { DEFAULT_DISCOVERY_CONFIG } from '@/lib/types/app.types'
import { DiscoveryForm } from './DiscoveryForm'
import { toast } from 'sonner'

interface Props {
  initialConfig: DiscoveryConfig
}

const TYPE_LABELS: Record<DiscoveryQuestionType, string> = {
  single_choice: 'Single choice',
  multi_choice: 'Multiple choice',
  social_handles: 'Social handles',
  dropdown: 'Dropdown',
}

function QuestionEditor({
  q, index, total,
  onChange, onDelete, onMoveUp, onMoveDown,
}: {
  q: DiscoveryQuestion
  index: number
  total: number
  onChange: (q: DiscoveryQuestion) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [open, setOpen] = useState(false)

  const updateOption = (i: number, val: string) => {
    const opts = [...q.options]
    opts[i] = val
    onChange({ ...q, options: opts })
  }

  const addOption = () => onChange({ ...q, options: [...q.options, ''] })

  const removeOption = (i: number) => onChange({ ...q, options: q.options.filter((_, idx) => idx !== i) })

  return (
    <div className="rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-sm" style={{ borderColor: 'var(--border)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex flex-col gap-0.5 cursor-grab shrink-0 opacity-40 hover:opacity-70">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{q.text || <span className="italic text-muted-foreground">Untitled question</span>}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: q.page === 1 ? 'rgba(59,130,246,0.1)' : 'rgba(139,92,246,0.1)', color: q.page === 1 ? '#2563eb' : '#7c3aed' }}>
              Page {q.page}
            </span>
            <span className="text-[11px] text-muted-foreground">{TYPE_LABELS[q.type]}</span>
            {q.options.length > 0 && <span className="text-[11px] text-muted-foreground">{q.options.length} options</span>}
            {q.required && <span className="text-[11px] font-semibold" style={{ color: '#f24a49' }}>Required</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onMoveUp} disabled={index === 0}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-20" title="Move up">
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={onMoveDown} disabled={index === total - 1}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-20" title="Move down">
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <label className="flex items-center gap-1 cursor-pointer select-none" title="Require this question to be answered before proceeding">
            <input type="checkbox" checked={q.required ?? false}
              onChange={e => onChange({ ...q, required: e.target.checked })}
              className="w-3.5 h-3.5 rounded accent-red-500 cursor-pointer"
            />
            <span className="text-[11px] font-medium text-muted-foreground">Required</span>
          </label>
          <button onClick={() => setOpen(o => !o)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground text-xs font-medium px-2">
            {open ? 'Done' : 'Edit'}
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
          </button>
        </div>
      </div>

      {/* Edit panel */}
      {open && (
        <div className="px-4 pb-4 pt-1 border-t space-y-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--muted)/30' }}>
          {/* Question text */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Question text</label>
            <textarea value={q.text} onChange={e => onChange({ ...q, text: e.target.value })} rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
              placeholder="Enter your question..."
            />
          </div>

          {/* Type + Page */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</label>
              <select value={q.type} onChange={e => onChange({ ...q, type: e.target.value as DiscoveryQuestionType })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none cursor-pointer">
                <option value="single_choice">Single choice</option>
                <option value="multi_choice">Multiple choice</option>
                <option value="dropdown">Dropdown</option>
                <option value="social_handles">Social handles</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Page</label>
              <select value={q.page} onChange={e => onChange({ ...q, page: Number(e.target.value) as 1 | 2 })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm outline-none cursor-pointer">
                <option value={1}>Page 1 – Your Details</option>
                <option value={2}>Page 2 – Your Needs</option>
              </select>
            </div>
          </div>

          {/* Options */}
          {q.type !== 'social_handles' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Options</label>
              {q.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center"
                    style={{ borderColor: 'var(--border)' }}>
                    {q.type === 'single_choice'
                      ? <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                      : <div className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/30" />}
                  </div>
                  <input value={opt} onChange={e => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                  <button onClick={() => removeOption(i)} disabled={q.options.length <= 1}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-20">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              ))}
              <button onClick={addOption}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors mt-1">
                <Plus className="w-3.5 h-3.5" /> Add option
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FormPreview({ config, mobile }: { config: DiscoveryConfig; mobile: boolean }) {
  return (
    <div className={`mx-auto transition-all duration-300 ${mobile ? 'max-w-[375px]' : 'w-full'}`}>
      {mobile && (
        <div className="rounded-[2.5rem] border-4 border-foreground/10 overflow-hidden shadow-2xl bg-white">
          <div className="h-6 bg-foreground/5 flex items-center justify-center">
            <div className="w-20 h-1.5 rounded-full bg-foreground/20" />
          </div>
          <div className="overflow-y-auto max-h-[600px]" style={{ backgroundColor: '#f8f7f4' }}>
            <DiscoveryForm tokenId="" token="" label={null} isExpired={false} isUsed={false} previewConfig={config} />
          </div>
        </div>
      )}
      {!mobile && (
        <div className="rounded-2xl border border-border overflow-hidden shadow-lg">
          <div className="h-8 flex items-center gap-2 px-4" style={{ backgroundColor: '#1C1C1E' }}>
            <div className="flex gap-1.5">
              {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />)}
            </div>
            <div className="flex-1 mx-4 h-4 rounded-md bg-white/10 text-[10px] text-white/40 flex items-center justify-center">
              task.pixelplay.agency/discovery/...
            </div>
          </div>
          <div className="overflow-y-auto max-h-[600px]" style={{ backgroundColor: '#f8f7f4' }}>
            <DiscoveryForm tokenId="" token="" label={null} isExpired={false} isUsed={false} previewConfig={config} />
          </div>
        </div>
      )}
    </div>
  )
}

function ImageUploader({
  label, value, slot, shape, height,
  onChange,
}: {
  label: string
  value: string | null | undefined
  slot: 'cover' | 'profile'
  shape: 'rect' | 'circle'
  height: number
  onChange: (url: string | null) => void
}) {
  const inputId = useId()
  const [uploading, setUploading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('slot', slot)
      const res = await fetch('/api/discovery/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        onChange(data.url)
        toast.success('Image uploaded')
      } else {
        toast.error('Upload failed: ' + (data.error ?? 'unknown'))
      }
    } catch (err) {
      toast.error('Upload error: ' + String(err))
    } finally {
      setUploading(false)
    }
  }

  const preview = value || null
  const isCircle = shape === 'circle'

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>

      {/* Hidden file input — triggered via label htmlFor */}
      <input id={inputId} type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={handleFile} />

      <label
        htmlFor={inputId}
        className={`relative flex items-center justify-center cursor-pointer group border-2 border-dashed transition-colors hover:border-primary/50 ${isCircle ? 'rounded-full mx-auto' : 'rounded-xl w-full'} ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
        style={{
          width: isCircle ? height : undefined,
          height,
          overflow: 'hidden',
          borderColor: 'var(--border)',
          backgroundColor: 'var(--muted)',
          display: 'flex',
        }}
      >
        {preview
          ? <img src={preview} alt={label} className="w-full h-full object-cover" />
          : (
            <div className="flex flex-col items-center gap-1.5 select-none">
              {slot === 'cover'
                ? <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                : <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              }
              <span className="text-[11px] text-muted-foreground">Click to upload</span>
            </div>
          )
        }
        {preview && !uploading && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex items-center gap-1 text-white text-xs font-medium">
              <Upload className="w-4 h-4" /> Replace
            </div>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
      </label>

      {preview && !uploading && (
        <button type="button" onClick={() => onChange(null)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-red-500 transition-colors mx-auto">
          <X className="w-3 h-3" /> Remove image
        </button>
      )}
    </div>
  )
}

export function DiscoveryEditor({ initialConfig }: Props) {
  const [config, setConfig] = useState<DiscoveryConfig>(initialConfig)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [saving, startSave] = useTransition()

  const questions = config.questions

  const updateQuestion = (i: number, q: DiscoveryQuestion) => {
    const next = [...questions]
    next[i] = q
    setConfig(c => ({ ...c, questions: next }))
  }

  const deleteQuestion = (i: number) => {
    setConfig(c => ({ ...c, questions: questions.filter((_, idx) => idx !== i) }))
  }

  const moveUp = (i: number) => {
    if (i === 0) return
    const next = [...questions]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    setConfig(c => ({ ...c, questions: next }))
  }

  const moveDown = (i: number) => {
    if (i === questions.length - 1) return
    const next = [...questions]
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    setConfig(c => ({ ...c, questions: next }))
  }

  const addQuestion = () => {
    const newQ: DiscoveryQuestion = {
      id: `q_${Date.now()}`,
      page: 2,
      text: '',
      type: 'single_choice',
      options: ['Option 1', 'Option 2'],
    }
    setConfig(c => ({ ...c, questions: [...questions, newQ] }))
  }

  const resetToDefault = () => {
    if (!confirm('Reset all questions to the default? This cannot be undone.')) return
    setConfig(DEFAULT_DISCOVERY_CONFIG)
    toast.info('Reset to default')
  }

  const save = () => {
    startSave(async () => {
      const res = await fetch('/api/discovery/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (res.ok) toast.success('Form saved — new submissions will use these questions')
      else toast.error('Failed to save')
    })
  }

  return (
    <div className="space-y-5">
      {/* Branding */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Branding</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ImageUploader label="Cover / Wallpaper Image" value={config.coverImageUrl} slot="cover" shape="rect" height={100}
            onChange={url => setConfig({ ...config, coverImageUrl: url })} />
          <ImageUploader label="Profile / Logo Image" value={config.profileImageUrl} slot="profile" shape="circle" height={100}
            onChange={url => setConfig({ ...config, profileImageUrl: url })} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Form description</label>
          <textarea value={config.formDescription ?? ''} onChange={e => setConfig({ ...config, formDescription: e.target.value || null })}
            rows={2} placeholder="Short intro paragraph shown under the title..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Form Questions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{questions.length} questions · changes apply to all future submissions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={resetToDefault}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button onClick={() => setPreviewOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium transition-colors"
            style={{ borderColor: previewOpen ? '#f24a49' : undefined, color: previewOpen ? '#f24a49' : undefined }}>
            <Eye className="w-3.5 h-3.5" /> {previewOpen ? 'Hide Preview' : 'Preview'}
          </button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-60"
            style={{ backgroundColor: '#f24a49', boxShadow: '0 4px 14px rgba(242,74,73,0.25)' }}>
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className={`grid gap-6 ${previewOpen ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Editor */}
        <div className="space-y-3">
          {questions.map((q, i) => (
            <QuestionEditor key={q.id} q={q} index={i} total={questions.length}
              onChange={updated => updateQuestion(i, updated)}
              onDelete={() => deleteQuestion(i)}
              onMoveUp={() => moveUp(i)}
              onMoveDown={() => moveDown(i)}
            />
          ))}
          <button onClick={addQuestion}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-colors hover:border-primary hover:text-primary"
            style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>

        {/* Preview panel */}
        {previewOpen && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Preview</p>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted">
                <button onClick={() => setMobile(false)}
                  className={`p-1.5 rounded-md transition-colors ${!mobile ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}>
                  <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => setMobile(true)}
                  className={`p-1.5 rounded-md transition-colors ${mobile ? 'bg-background shadow-sm' : 'hover:bg-background/50'}`}>
                  <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="sticky top-4">
              <FormPreview config={config} mobile={mobile} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
