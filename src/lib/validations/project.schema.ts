import { z } from 'zod'

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).optional(),
  color: z.string().default('#6366f1'),
  cover_image_url: z.string().url().optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  instagram_url: z.string().url().optional().nullable(),
  facebook_url: z.string().url().optional().nullable(),
  tiktok_url: z.string().url().optional().nullable(),
})

export type ProjectFormValues = z.infer<typeof projectSchema>
