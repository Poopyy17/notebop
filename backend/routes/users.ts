import { Router, Request, Response } from 'express'
import { stackServerApp } from '../lib/stack.js'
import { sql } from '../lib/db.js'

const router = Router()

// Get suggested friends (random users excluding self and existing relationships)
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const { userId, limit = '10' } = req.query

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const maxLimit = Math.min(parseInt(limit as string, 10) || 10, 20)

    // Get all existing relationships (friends + pending requests) from DB
    const existingRelationships = await sql`
      SELECT addressee_id as user_id FROM friendships WHERE requester_id = ${userId}
      UNION
      SELECT requester_id as user_id FROM friendships WHERE addressee_id = ${userId}
    `
    const excludedUserIds = new Set(
      (existingRelationships as Array<{ user_id: string }>).map((r) => r.user_id)
    )
    excludedUserIds.add(userId) // Also exclude self

    // Get all users from Stack Auth
    const allUsersResult = await stackServerApp.listUsers()
    const allUsers = Array.isArray(allUsersResult) ? allUsersResult : []

    // Filter out excluded users and format
    const eligibleUsers = allUsers
      .filter((user: { id: string }) => !excludedUserIds.has(user.id))
      .map((user: { id: string; displayName?: string | null; primaryEmail?: string | null; profileImageUrl?: string | null }) => ({
        id: user.id,
        name: user.displayName || user.primaryEmail?.split('@')[0] || 'Unknown',
        email: user.primaryEmail || '',
        profileImageUrl: user.profileImageUrl || '',
      }))

    // Shuffle and take random users up to limit
    const shuffled = eligibleUsers.sort(() => Math.random() - 0.5)
    const suggestedUsers = shuffled.slice(0, maxLimit)

    return res.json({ users: suggestedUsers })
  } catch (error) {
    console.error('Error fetching suggested users:', error)
    return res.status(500).json({ error: 'Failed to fetch suggested users' })
  }
})

// Search users by name (excludes the searching user)
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query, userId } = req.query

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' })
    }

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.json({ users: [] })
    }

    const searchTerm = query.trim().toLowerCase()

    // Get all users from Stack Auth and filter
    const allUsersResult = await stackServerApp.listUsers()
    
    // listUsers returns an array with nextCursor property
    const allUsers = Array.isArray(allUsersResult) ? allUsersResult : []
    
    const filteredUsers = allUsers
      .filter((user: { id: string; displayName?: string | null }) => {
        // Exclude the searching user
        if (user.id === userId) return false
        
        // Search by display name
        const displayName = user.displayName?.toLowerCase() || ''
        return displayName.includes(searchTerm)
      })
      .slice(0, 20) // Limit to 20 results
      .map((user: { id: string; displayName?: string | null; primaryEmail?: string | null; profileImageUrl?: string | null }) => ({
        id: user.id,
        name: user.displayName || user.primaryEmail?.split('@')[0] || 'Unknown',
        email: user.primaryEmail || '',
        profileImageUrl: user.profileImageUrl || '',
      }))

    return res.json({ users: filteredUsers })
  } catch (error) {
    console.error('Error searching users:', error)
    return res.status(500).json({ error: 'Failed to search users' })
  }
})

// Get a single user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const user = await stackServerApp.getUser(id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json({
      user: {
        id: user.id,
        name: user.displayName || user.primaryEmail?.split('@')[0] || 'Unknown',
        email: user.primaryEmail || '',
        profileImageUrl: user.profileImageUrl || '',
      },
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return res.status(500).json({ error: 'Failed to fetch user' })
  }
})

export default router
