import { z } from 'zod'

export const taskSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1, 'Task title is required').max(200),
  description: z.string().max(2000).optional(),
  assigned_to: z.string().uuid().optional().nullable(),
  due_date: z.string().optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed']).default('todo'),
  task_type: z.enum(['standard', 'simple']).default('standard'),
})

export type TaskFormValues = z.infer<typeof taskSchema>

export const taskStatusSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'review', 'completed']),
  sort_order: z.number().int().min(0),
})
