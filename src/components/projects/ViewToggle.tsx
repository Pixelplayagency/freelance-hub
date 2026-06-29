'use client'

import { useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ProjectTaskList } from './ProjectTaskList'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { CreateTaskButton } from '@/components/tasks/CreateTaskButton'
import type { Task, TaskStatus, Profile } from '@/lib/types/app.types'

type AssigneeMap = Record<string, Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[]>
type CountMap = Record<string, number>
type SubtaskMap = Record<string, { done: number; total: number }>

interface ViewToggleProps {
  tasks: Task[]
  projectId: string
  isAdmin: boolean
  assigneeMap: AssigneeMap
  commentCounts: CountMap
  subtaskCounts: SubtaskMap
  freelancers: Pick<Profile, 'id' | 'full_name' | 'email'>[]
}

type ViewMode = 'board' | 'list'

export function ViewToggle({ tasks, projectId, isAdmin, assigneeMap, commentCounts, subtaskCounts, freelancers }: ViewToggleProps) {
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(`view-${projectId}`) as ViewMode) || 'board'
    }
    return 'board'
  })

  const [addTaskStatus, setAddTaskStatus] = useState<TaskStatus | null>(null)

  function switchView(v: ViewMode) {
    setView(v)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`view-${projectId}`, v)
    }
  }

  return (
    <div>
      {/* Header with view toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => switchView('board')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              view === 'board'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Board
          </button>
          <button
            onClick={() => switchView('list')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              view === 'list'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>
        </div>
      </div>

      {/* View content */}
      {view === 'board' ? (
        <>
          <KanbanBoard
            initialTasks={tasks}
            projectId={projectId}
            isAdmin={isAdmin}
            assigneeMap={assigneeMap}
            commentCounts={commentCounts}
            subtaskCounts={subtaskCounts}
            onAddTask={isAdmin ? (status) => setAddTaskStatus(status) : undefined}
          />
          {addTaskStatus !== null && (
            <CreateTaskButton
              projectId={projectId}
              freelancers={freelancers}
              defaultOpen
              onClose={() => setAddTaskStatus(null)}
            />
          )}
        </>
      ) : (
        <ProjectTaskList
          tasks={tasks}
          projectId={projectId}
          isAdmin={isAdmin}
          assigneeMap={assigneeMap}
        />
      )}
    </div>
  )
}
