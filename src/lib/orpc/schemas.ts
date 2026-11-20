import { z } from 'zod'

export const sessionStatusSchema = z.enum([
  'active',
  'waiting_user',
  'idle',
  'archived',
])
export type SessionStatus = z.infer<typeof sessionStatusSchema>

export const localPosSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
})
export type LocalPos = z.infer<typeof localPosSchema>

export const sessionNodeSchema = z.object({
  id: z.string(),
  islandId: z.string(),
  title: z.string(),
  status: sessionStatusSchema,
  lastActivityAt: z.string(),
  previewSnippet: z.string(),
  localPos: localPosSchema,
})
export type SessionNode = z.infer<typeof sessionNodeSchema>

export const islandSchema = z.object({
  id: z.string(),
  name: z.string(),
  coordinates: z.object({
    x: z.number(),
    y: z.number(),
  }),
  themeColor: z.string(),
  sessions: z.array(sessionNodeSchema),
})
export type Island = z.infer<typeof islandSchema>
