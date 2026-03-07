'use client'

import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  closestCenter,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { useKanbanStore } from './useKanbanStore'
import { useTaskRealtime } from '@/lib/hooks/useTaskRealtime'
import { updateTaskStatus } from '@/lib/actions/task.actions'
import type { Task, TaskStatus } from '@/lib/types/app.types'
import { toast } from 'sonner'
import { TASK_STATUSES } from '@/lib/types/app.types'

const COLUMNS = TASK_STATUSES.map(s => ({
  id: s.id,
  label: s.label,
  bg: s.bg,
  dot: {
    todo: 'bg-slate-400',
    in_progress: 'bg-blue-500',
    review: 'bg-amber-500',
    completed: 'bg-green-500',
  }[s.id],
}))

interface KanbanBoardProps {
  initialTasks: Task[]
  projectId: string
  isAdmin: boolean
}

export function KanbanBoard({ initialTasks, projectId, isAdmin }: KanbanBoardProps) {
  const { tasks, setTasks, moveTask, revertTasks, getPreviousSnapshot } = useKanbanStore()
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const initialized = useRef(false)

  // Initialize store once
  useEffect(() => {
    if (!initialized.current) {
      setTasks(initialTasks)
      initialized.current = true
    }
  }, [initialTasks, setTasks])

  // Realtime sync
  useTaskRealtime(projectId)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeTask = tasks.find(t => t.id === active.id)
    if (!activeTask) return

    // Determine target column
    let newStatus: TaskStatus
    const overIsColumn = COLUMNS.some(c => c.id === over.id)
    if (overIsColumn) {
      newStatus = over.id as TaskStatus
    } else {
      const overTask = tasks.find(t => t.id === over.id)
      if (!overTask) return
      newStatus = overTask.status
    }

    // Determine new index within target column
    const targetColumnTasks = tasks.filter(t => t.status === newStatus && t.id !== active.id)
    const overTaskIdx = targetColumnTasks.findIndex(t => t.id === over.id)
    const newIndex = overTaskIdx === -1 ? targetColumnTasks.length : overTaskIdx

    // Already in place?
    if (activeTask.status === newStatus) {
      const currentIdx = tasks.filter(t => t.status === newStatus).findIndex(t => t.id === active.id)
      if (currentIdx === newIndex) return
    }

    // Snapshot for rollback
    const snapshot = getPreviousSnapshot()

    // Optimistic update
    moveTask(active.id as string, newStatus, newIndex)

    // Persist
    try {
      await updateTaskStatus(active.id as string, newStatus, newIndex)
    } catch {
      revertTasks(snapshot)
      toast.error('Failed to move task. Please try again.')
    }
  }

  const tasksByStatus = COLUMNS.reduce<Record<string, Task[]>>((acc, col) => {
    acc[col.id] = tasks
      .filter(t => t.status === col.id)
      .sort((a, b) => a.sort_order - b.sort_order)
    return acc
  }, {})

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-12rem)]">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={tasksByStatus[col.id] ?? []}
            projectId={projectId}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <KanbanCard
            task={activeTask}
            projectId={projectId}
            isAdmin={isAdmin}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
