import { StackServerApp } from '@stackframe/js'

export const stackServerApp = new StackServerApp({
  projectId: process.env.STACK_PROJECT_ID!,
  publishableClientKey: process.env.STACK_PUBLISHABLE_CLIENT_KEY!,
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY!,
  tokenStore: 'memory',
})
