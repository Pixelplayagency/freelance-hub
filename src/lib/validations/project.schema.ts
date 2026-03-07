import { z } from 'zod'

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).optional(),
  color: z.string().default('#6366f1'),
})

export type ProjectFormValues = z.infer<typeof projectSchema>
