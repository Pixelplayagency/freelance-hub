'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Pencil } from 'lucide-react'
import { TaskForm } from './TaskForm'
import type { Profile, Task } from '@/lib/types/app.types'

interface EditTaskButtonProps {
  task: Task
  freelancers: Pick<Profile, 'id' | 'full_name' | 'email'>[]
  projectId: string
}

export function EditTaskButton({ task, freelancers, projectId }: EditTaskButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="w-3.5 h-3.5 mr-1.5" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>
        <TaskForm
          projectId={projectId}
          freelancers={freelancers}
          task={task}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
