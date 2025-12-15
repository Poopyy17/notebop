import { Request, Response, NextFunction } from 'express'
import { stackServerApp } from '../lib/stack.js'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string | null
        displayName: string | null
      }
      accessToken?: string
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' })
    }

    const accessToken = authHeader.split(' ')[1]
    const user = await stackServerApp.getUser({ accessToken })

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    req.user = {
      id: user.id,
      email: user.primaryEmail,
      displayName: user.displayName,
    }
    req.accessToken = accessToken

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(401).json({ error: 'Authentication failed' })
  }
}
