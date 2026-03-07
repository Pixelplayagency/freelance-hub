import { create } from 'zustand'
import type { Task, TaskStatus } from '@/lib/types/app.types'

interface KanbanStore {
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  addTask: (task: Task) => void
  removeTask: (taskId: string) => void
  moveTask: (taskId: string, newStatus: TaskStatus, newIndex: number) => void
  revertTasks: (previous: Task[]) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  getPreviousSnapshot: () => Task[]
}

export const useKanbanStore = create<KanbanStore>((set, get) => ({
  tasks: [],

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) => set(state => ({
    tasks: state.tasks.some(t => t.id === task.id)
      ? state.tasks
      : [...state.tasks, task],
  })),

  removeTask: (taskId) => set(state => ({
    tasks: state.tasks.filter(t => t.id !== taskId),
  })),

  getPreviousSnapshot: () => get().tasks,

  moveTask: (taskId, newStatus, newIndex) => {
    set(state => {
      const tasks = [...state.tasks]
      const taskIdx = tasks.findIndex(t => t.id === taskId)
      if (taskIdx === -1) return state

      const task = { ...tasks[taskIdx], status: newStatus }
      tasks.splice(taskIdx, 1)

      // Get tasks in target column (excluding the moved task)
      const targetColumnTasks = tasks.filter(t => t.status === newStatus)
      const otherTasks = tasks.filter(t => t.status !== newStatus)

      // Insert at correct position
      targetColumnTasks.splice(newIndex, 0, task)

      // Reassign sort_order
      const updatedTarget = targetColumnTasks.map((t, i) => ({ ...t, sort_order: i }))

      return { tasks: [...otherTasks, ...updatedTarget] }
    })
  },

  revertTasks: (previous) => set({ tasks: previous }),

  updateTask: (taskId, updates) => {
    set(state => ({
      tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t),
    }))
  },
}))
