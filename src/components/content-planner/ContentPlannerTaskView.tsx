'use client'

import { useState, useTransition } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { setTaskStatus } from '@/lib/actions/task.actions'
import { TASK_STATUSES } from '@/lib/types/app.types'
import { dueDateLabel } from '@/lib/utils/date'
import { CalendarClock, CheckCheck, ArrowRight, GripVertical } from 'lucide-react'
import type { Task, Project, TaskStatus } from '@/lib/types/app.types'

type TaskWithProject = Task & {
  project: Pick<Project, 'id' | 'name' | 'color' | 'avatar_url'> | null
}

const STATUS_NEXT: Record<TaskStatus, TaskStatus> = {
  todo:        'in_progress',
  in_progress: 'review',
  review:      'completed',
  completed:   'todo',
}

const STATUS_NEXT_LABEL: Record<TaskStatus, string> = {
  todo:        'Start',
  in_progress: 'Send for Review',
  review:      'Mark Complete',
  completed:   'Reopen',
}

const COLUMN_STYLES: Record<TaskStatus, {
  header: string; dot: string; countBg: string; dropHighlight: string; advanceBtn: string
}> = {
  todo:        { header: 'text-slate-500 dark:text-slate-400',  dot: 'bg-slate-400',  countBg: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',        dropHighlight: 'border-slate-300 bg-slate-50/60 dark:border-slate-600 dark:bg-slate-800/30',  advanceBtn: 'bg-blue-500 hover:bg-blue-600 text-white'   },
  in_progress: { header: 'text-blue-500 dark:text-blue-400',    dot: 'bg-blue-400',   countBg: 'bg-blue-100 dark:bg-blue-800/60 text-blue-700 dark:text-blue-300',          dropHighlight: 'border-blue-300 bg-blue-50/60 dark:border-blue-700 dark:bg-blue-900/20',     advanceBtn: 'bg-amber-500 hover:bg-amber-600 text-white' },
  review:      { header: 'text-amber-500 dark:text-amber-400',  dot: 'bg-amber-400',  countBg: 'bg-amber-100 dark:bg-amber-800/60 text-amber-700 dark:text-amber-300',      dropHighlight: 'border-amber-300 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-900/20', advanceBtn: 'bg-green-500 hover:bg-green-600 text-white'  },
  completed:   { header: 'text-green-500 dark:text-green-400',  dot: 'bg-green-500',  countBg: 'bg-green-100 dark:bg-green-800/60 text-green-700 dark:text-green-300',      dropHighlight: 'border-green-300 bg-green-50/60 dark:border-green-700 dark:bg-green-900/20', advanceBtn: 'bg-slate-400 hover:bg-slate-500 text-white'  },
}

/* ─── Droppable Column ─── */
function DroppableColumn({
  status,
  children,
}: {
  status: TaskStatus
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const col = COLUMN_STYLES[status]
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 min-h-[80px] rounded-xl border-2 transition-all p-1 -m-1 ${
        isOver
          ? `${col.dropHighlight} border-dashed`
          : 'border-transparent'
      }`}
    >
      {children}
    </div>
  )
}

/* ─── Draggable Task Card ─── */
function DraggableTaskCard({
  task,
  onAdvance,
  isDragOverlay = false,
}: {
  task: TaskWithProject
  onAdvance: (task: TaskWithProject) => void
  isDragOverlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  const { label: dateLabel, className: dateCls } = dueDateLabel(task.due_date)
  const col = COLUMN_STYLES[task.status]
  const nextLabel = STATUS_NEXT_LABEL[task.status]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-border bg-card p-3 space-y-2.5 transition-all select-none ${
        isDragging && !isDragOverlay
          ? 'opacity-40 scale-95 shadow-none'
          : isDragOverlay
          ? 'shadow-2xl rotate-1 ring-2 ring-primary/30 opacity-100'
          : 'hover:shadow-md cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* Drag handle row + project */}
      <div className="flex items-center gap-1.5">
        <div
          {...attributes}
          {...listeners}
          className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors cursor-grab active:cursor-grabbing touch-none shrink-0"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
        {task.project ? (
          <>
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: task.project.color }}
            />
            <span className="text-[10px] text-muted-foreground font-medium truncate">
              {task.project.name}
            </span>
          </>
        ) : (
          <span className="flex-1" />
        )}
      </div>

      {/* Title */}
      <p className="text-xs font-semibold text-foreground leading-snug line-clamp-3">
        {task.title}
      </p>

      {/* Description */}
      {task.description && (
        <p className="text-[11px] text-muted-foreground/70 leading-snug line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Due date */}
      {task.due_date && (
        <div className={`flex items-center gap-1 text-[10px] ${dateCls}`}>
          <CalendarClock className="w-3 h-3 shrink-0" />
          {dateLabel}
        </div>
      )}

      {/* Advance button */}
      <button
        onClick={e => { e.stopPropagation(); onAdvance(task) }}
        className={`w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold py-1.5 rounded-lg transition-colors mt-1 ${col.advanceBtn}`}
      >
        {nextLabel}
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  )
}

/* ─── Main Component ─── */
export function ContentPlannerTaskView({ tasks: initialTasks }: { tasks: TaskWithProject[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [activeTask, setActiveTask] = useState<TaskWithProject | null>(null)
  const [, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function moveTaskStatus(task: TaskWithProject, next: TaskStatus) {
    if (task.status === next) return
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t))
    startTransition(async () => {
      try {
        await setTaskStatus(task.id, next)
      } catch {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t))
      }
    })
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return
    const task = tasks.find(t => t.id === active.id)
    if (!task) return
    const newStatus = over.id as TaskStatus
    moveTaskStatus(task, newStatus)
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CheckCheck className="w-10 h-10 text-muted-foreground/20 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No tasks assigned yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Tasks assigned to you will appear here</p>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TASK_STATUSES.map(({ id: status, label }) => {
          const col = COLUMN_STYLES[status]
          const colTasks = tasks.filter(t => t.status === status)
          return (
            <div key={status} className="flex flex-col gap-2">
              {/* Column header */}
              <div className="flex items-center gap-2 px-1 mb-1">
                <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
                <span className={`text-xs font-semibold ${col.header}`}>{label}</span>
                <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${col.countBg}`}>
                  {colTasks.length}
                </span>
              </div>

              <DroppableColumn status={status}>
                {colTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/40 px-3 py-8 text-center">
                    <p className="text-[11px] text-muted-foreground/40">Drop here</p>
                  </div>
                ) : (
                  colTasks.map(task => (
                    <DraggableTaskCard
                      key={task.id}
                      task={task}
                      onAdvance={t => moveTaskStatus(t, STATUS_NEXT[t.status])}
                    />
                  ))
                )}
              </DroppableColumn>
            </div>
          )
        })}
      </div>

      {/* Floating card while dragging */}
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeTask && (
          <DraggableTaskCard
            task={activeTask}
            onAdvance={() => {}}
            isDragOverlay
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
