'use client'

import { useEffect } from 'react'
import { useSupabase } from '@/providers/SupabaseProvider'
import { useKanbanStore } from '@/components/kanban/useKanbanStore'
import type { Task } from '@/lib/types/app.types'

export function useTaskRealtime(projectId: string) {
  const supabase = useSupabase()
  const { updateTask, removeTask } = useKanbanStore()

  useEffect(() => {
    const channel = supabase
      .channel(`tasks:project:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const updated = payload.new as Task
          updateTask(updated.id, updated)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          removeTask((payload.old as Task).id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, supabase, updateTask, removeTask])
}
