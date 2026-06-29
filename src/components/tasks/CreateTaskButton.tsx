'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { TaskForm } from './TaskForm'
import { useKanbanStore } from '@/components/kanban/useKanbanStore'
import type { Profile, Task } from '@/lib/types/app.types'

interface CreateTaskButtonProps {
  projectId: string
  freelancers: Pick<Profile, 'id' | 'full_name' | 'email'>[]
  defaultOpen?: boolean
  onClose?: () => void
}

export function CreateTaskButton({ projectId, freelancers, defaultOpen = false, onClose }: CreateTaskButtonProps) {
  const [open, setOpen] = useState(defaultOpen)
  const addTask = useKanbanStore(s => s.addTask)

  function handleSuccess(newTask?: Task) {
    if (newTask) addTask(newTask)
    setOpen(false)
    onClose?.()
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) onClose?.()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!defaultOpen && (
        <DialogTrigger asChild>
          <Button size="sm" className="text-white shadow-sm shrink-0" style={{ backgroundColor: 'var(--primary)' }}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add task
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <TaskForm
          projectId={projectId}
          freelancers={freelancers}
          onSuccess={handleSuccess}
          onCancel={() => handleOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
