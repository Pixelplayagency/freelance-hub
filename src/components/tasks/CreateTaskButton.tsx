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
}

export function CreateTaskButton({ projectId, freelancers }: CreateTaskButtonProps) {
  const [open, setOpen] = useState(false)
  const addTask = useKanbanStore(s => s.addTask)

  function handleSuccess(newTask?: Task) {
    if (newTask) addTask(newTask)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm shrink-0">
          <Plus className="w-4 h-4 mr-1.5" />
          Add task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <TaskForm
          projectId={projectId}
          freelancers={freelancers}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
