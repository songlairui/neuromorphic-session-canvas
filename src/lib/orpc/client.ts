import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import type { appRouter } from './router'

const origin =
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'

const link = new RPCLink({
  url: `${origin}/api/rpc`,
})

export const client: RouterClient<typeof appRouter> = createORPCClient(link)
