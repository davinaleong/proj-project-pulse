import { z } from 'zod'

// Note status enum from Prisma schema
export const NoteStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  PRIVATE: 'PRIVATE',
  PUBLIC: 'PUBLIC',
} as const

export type NoteStatusType = keyof typeof NoteStatus

// Validation schemas
export const createNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().optional(),
  body: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'PRIVATE', 'PUBLIC']).default('DRAFT'),
  projectId: z.number().int().positive().optional(),
})

export const updateNoteSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title too long')
    .optional(),
  description: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'PRIVATE', 'PUBLIC']).optional(),
  projectId: z.number().int().positive().optional().nullable(),
})

export const noteQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['DRAFT', 'PUBLISHED', 'PRIVATE', 'PUBLIC']).optional(),
  projectId: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
})

// Types
export type CreateNoteData = z.infer<typeof createNoteSchema>
export type UpdateNoteData = z.infer<typeof updateNoteSchema>
export type NoteQuery = z.infer<typeof noteQuerySchema>
