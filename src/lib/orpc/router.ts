import { ORPCError, os } from '@orpc/server'
import { z } from 'zod'
import { db, findIsland } from './mock'
import { islandSchema, sessionNodeSchema, sessionStatusSchema } from './schemas'

const createSessionInput = z.object({
  islandId: z.string(),
  title: z.string().min(1).max(120).optional(),
})

const setStatusInput = z.object({
  sessionId: z.string(),
  status: sessionStatusSchema,
})

export const appRouter = os.router({
  islands: {
    list: os.output(z.array(islandSchema)).handler(() => db.islands),

    createSession: os
      .input(createSessionInput)
      .output(sessionNodeSchema)
      .handler(({ input }) => {
        const island = findIsland(input.islandId)
        if (!island) {
          throw new ORPCError('NOT_FOUND', { message: 'Island not found' })
        }
        const used = new Set(
          island.sessions.map((s) => `${s.localPos.row}:${s.localPos.col}`),
        )
        let row = 0
        let col = 0
        while (used.has(`${row}:${col}`)) {
          col += 1
          if (col > 8) {
            col = 0
            row += 1
          }
        }
        const session = {
          id: `ses_${Date.now().toString(36)}_${island.sessions.length}`,
          islandId: island.id,
          title: input.title ?? `新会话 ${island.sessions.length + 1}`,
          status: 'active' as const,
          lastActivityAt: new Date().toISOString(),
          previewSnippet: '刚落座的新建筑，还没有内容。',
          localPos: { row, col },
        }
        island.sessions.push(session)
        return session
      }),
  },

  sessions: {
    setStatus: os
      .input(setStatusInput)
      .output(sessionNodeSchema)
      .handler(({ input }) => {
        for (const island of db.islands) {
          const session = island.sessions.find((s) => s.id === input.sessionId)
          if (session) {
            session.status = input.status
            session.lastActivityAt = new Date().toISOString()
            return session
          }
        }
        throw new ORPCError('NOT_FOUND', { message: 'Session not found' })
      }),
  },
})
