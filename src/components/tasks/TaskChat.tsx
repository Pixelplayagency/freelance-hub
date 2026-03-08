'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { saveTaskReference } from '@/lib/actions/upload.actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/cn'
import { formatRelative } from '@/lib/utils/date'
import type { TaskReference } from '@/lib/types/app.types'

interface TaskChatProps {
  taskId: string
  messages: TaskReference[]
  currentUserId: string
  otherPartyName?: string | null
  canEdit: boolean
}

function parseContent(raw: string | null): string {
  if (!raw) return ''
  try {
    // TipTap JSON → extract plain text
    const doc = JSON.parse(raw)
    const texts: string[] = []
    function walk(node: Record<string, unknown>) {
      if (node.type === 'text' && typeof node.text === 'string') texts.push(node.text)
      if (Array.isArray(node.content)) (node.content as Record<string, unknown>[]).forEach(walk)
    }
    walk(doc)
    return texts.join(' ')
  } catch {
    return raw
  }
}

export function TaskChat({
  taskId,
  messages,
  currentUserId,
  otherPartyName,
  canEdit,
}: TaskChatProps) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed) return
    setSending(true)
    try {
      await saveTaskReference(taskId, {
        type: 'note',
        content: trimmed,
        title: trimmed.slice(0, 60),
      })
      setText('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col" style={{ minHeight: '260px' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-2 pr-1" style={{ maxHeight: '360px' }}>
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">
            No messages yet. Start the conversation below.
          </p>
        )}

        {messages.map(msg => {
          const isOwn = msg.created_by === currentUserId
          const body = parseContent(msg.content)

          return (
            <div
              key={msg.id}
              className={cn('flex flex-col gap-0.5', isOwn ? 'items-end' : 'items-start')}
            >
              {/* Bubble */}
              <div
                className={cn(
                  'max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm',
                  isOwn
                    ? 'rounded-br-sm text-white'
                    : 'rounded-bl-sm bg-gray-900 text-white'
                )}
                style={isOwn ? { backgroundColor: '#f24a49' } : undefined}
              >
                {body}
              </div>
              {/* Timestamp + sender */}
              <span className="text-[10px] text-gray-400 px-1">
                {isOwn ? 'You' : (otherPartyName ?? 'Team')}
                {' · '}
                {formatRelative(msg.created_at)}
              </span>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {canEdit && (
        <div className="mt-3 flex items-end gap-2 border border-gray-200 rounded-2xl bg-white px-3 py-2 focus-within:border-[#f24a49] transition-colors">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            className="flex-1 resize-none text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none leading-relaxed bg-transparent"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = `${el.scrollHeight}px`
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-opacity disabled:opacity-30"
            style={{ backgroundColor: '#f24a49' }}
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      )}
    </div>
  )
}
