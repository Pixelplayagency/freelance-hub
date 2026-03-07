'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { saveTaskReference } from '@/lib/actions/upload.actions'
import { toast } from 'sonner'
import type { TaskReference } from '@/lib/types/app.types'
import { formatRelative } from '@/lib/utils/date'

interface ConceptNoteEditorProps {
  taskId: string
  references: TaskReference[]
  isAdmin: boolean
  canEdit: boolean // admin or task owner
}

function NoteViewer({ content }: { content: string }) {
  let parsed: object
  try {
    parsed = JSON.parse(content)
  } catch {
    return <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
  }

  const viewer = useEditor({
    extensions: [StarterKit, Link],
    content: parsed,
    editable: false,
  })

  return (
    <EditorContent
      editor={viewer}
      className="prose prose-sm max-w-none text-gray-700"
    />
  )
}

export function ConceptNoteEditor({ taskId, references, isAdmin, canEdit }: ConceptNoteEditorProps) {
  const [saving, setSaving] = useState(false)
  const [showEditor, setShowEditor] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[120px] p-3 focus:outline-none',
      },
    },
  })

  async function handleSave() {
    if (!editor) return
    const json = JSON.stringify(editor.getJSON())
    const text = editor.getText()
    if (!text.trim()) {
      toast.error('Note cannot be empty')
      return
    }
    setSaving(true)
    try {
      await saveTaskReference(taskId, {
        type: 'note',
        content: json,
        title: text.slice(0, 60),
      })
      toast.success('Note saved')
      editor.commands.clearContent()
      setShowEditor(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {references.length === 0 && !showEditor && (
        <p className="text-sm text-gray-400">No concept notes yet.</p>
      )}

      {/* Existing notes */}
      <div className="space-y-3">
        {references.map(ref => (
          <div key={ref.id} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <NoteViewer content={ref.content ?? ''} />
            <p className="text-xs text-gray-400 mt-2">{formatRelative(ref.created_at)}</p>
          </div>
        ))}
      </div>

      {/* Editor */}
      {canEdit && (
        <>
          {showEditor ? (
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              {/* Toolbar */}
              <div className="flex gap-1 p-2 border-b border-gray-100 bg-gray-50">
                {[
                  { label: 'B', action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive('bold') },
                  { label: 'I', action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive('italic') },
                  { label: 'H', action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), active: editor?.isActive('heading') },
                  { label: '•', action: () => editor?.chain().focus().toggleBulletList().run(), active: editor?.isActive('bulletList') },
                ].map(btn => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={btn.action}
                    className={`w-7 h-7 text-sm rounded font-medium transition-colors ${btn.active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              <EditorContent editor={editor} />
              <div className="flex gap-2 p-2 border-t border-gray-100">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save note'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowEditor(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setShowEditor(true)}>
              + Add concept note
            </Button>
          )}
        </>
      )}
    </div>
  )
}
