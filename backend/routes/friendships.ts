import { Router, Request, Response } from 'express'
import { sql } from '../lib/db.js'
import { stackServerApp } from '../lib/stack.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// Friendship interface
interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted'
  created_at: Date
  updated_at: Date
}

// Helper function to get user details from Stack Auth
async function getUserDetails(userId: string) {
  try {
    const user = await stackServerApp.getUser(userId)
    if (!user) return null
    return {
      id: user.id,
      name: user.displayName || user.primaryEmail?.split('@')[0] || 'Unknown',
      email: user.primaryEmail || '',
      profileImageUrl: user.profileImageUrl || '',
    }
  } catch {
    return null
  }
}

// Get friendship status between two users
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { userId, otherUserId } = req.query

    if (!userId || !otherUserId) {
      return res.status(400).json({ error: 'Both userId and otherUserId are required' })
    }

    // Check both directions
    const friendships = await sql`
      SELECT * FROM friendships 
      WHERE (requester_id = ${userId} AND addressee_id = ${otherUserId})
         OR (requester_id = ${otherUserId} AND addressee_id = ${userId})
      LIMIT 1
    `

    if (friendships.length === 0) {
      return res.json({ status: 'none', friendship: null })
    }

    const friendship = friendships[0]
    
    // Determine the relationship from current user's perspective
    let relationshipStatus: string
    if (friendship.status === 'accepted') {
      relationshipStatus = 'friends'
    } else if (friendship.requester_id === userId) {
      relationshipStatus = 'request_sent'
    } else {
      relationshipStatus = 'request_received'
    }

    return res.json({ status: relationshipStatus, friendship })
  } catch (error) {
    console.error('Error getting friendship status:', error)
    return res.status(500).json({ error: 'Failed to get friendship status' })
  }
})

// Get all friends for a user (accepted friendships)
router.get('/friends', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' })
    }

    // Get all accepted friendships
    const friendships = await sql`
      SELECT id, requester_id, addressee_id, created_at
      FROM friendships
      WHERE (requester_id = ${userId} OR addressee_id = ${userId})
        AND status = 'accepted'
      ORDER BY created_at DESC
    `

    // Get user details from Stack Auth for each friend
    const friends = await Promise.all(
      friendships.map(async (f) => {
        const friendId = f.requester_id === userId ? f.addressee_id : f.requester_id
        const userDetails = await getUserDetails(friendId)
        return {
          friendship_id: f.id,
          friends_since: f.created_at,
          id: friendId,
          name: userDetails?.name || 'Unknown',
          email: userDetails?.email || '',
          profileImageUrl: userDetails?.profileImageUrl || '',
        }
      })
    )

    // Sort by name
    friends.sort((a, b) => a.name.localeCompare(b.name))

    return res.json({ friends })
  } catch (error) {
    console.error('Error fetching friends:', error)
    return res.status(500).json({ error: 'Failed to fetch friends' })
  }
})

// Get incoming friend requests (pending, where user is addressee)
router.get('/requests/incoming', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const friendships = await sql`
      SELECT id, requester_id, created_at
      FROM friendships
      WHERE addressee_id = ${userId} AND status = 'pending'
      ORDER BY created_at DESC
    `

    // Get user details from Stack Auth for each requester
    const requests = await Promise.all(
      friendships.map(async (f) => {
        const userDetails = await getUserDetails(f.requester_id)
        return {
          friendship_id: f.id,
          requested_at: f.created_at,
          id: f.requester_id,
          name: userDetails?.name || 'Unknown',
          email: userDetails?.email || '',
          profileImageUrl: userDetails?.profileImageUrl || '',
        }
      })
    )

    return res.json({ requests })
  } catch (error) {
    console.error('Error fetching incoming requests:', error)
    return res.status(500).json({ error: 'Failed to fetch incoming requests' })
  }
})

// Get outgoing friend requests (pending, where user is requester)
router.get('/requests/outgoing', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const friendships = await sql`
      SELECT id, addressee_id, created_at
      FROM friendships
      WHERE requester_id = ${userId} AND status = 'pending'
      ORDER BY created_at DESC
    `

    // Get user details from Stack Auth for each addressee
    const requests = await Promise.all(
      friendships.map(async (f) => {
        const userDetails = await getUserDetails(f.addressee_id)
        return {
          friendship_id: f.id,
          requested_at: f.created_at,
          id: f.addressee_id,
          name: userDetails?.name || 'Unknown',
          email: userDetails?.email || '',
          profileImageUrl: userDetails?.profileImageUrl || '',
        }
      })
    )

    return res.json({ requests })
  } catch (error) {
    console.error('Error fetching outgoing requests:', error)
    return res.status(500).json({ error: 'Failed to fetch outgoing requests' })
  }
})

// Send a friend request
router.post('/request', async (req: Request, res: Response) => {
  try {
    const { requesterId, addresseeId } = req.body

    if (!requesterId || !addresseeId) {
      return res.status(400).json({ error: 'Requester ID and Addressee ID are required' })
    }

    if (requesterId === addresseeId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' })
    }

    // Check if friendship already exists in either direction
    const existing = await sql`
      SELECT * FROM friendships 
      WHERE (requester_id = ${requesterId} AND addressee_id = ${addresseeId})
         OR (requester_id = ${addresseeId} AND addressee_id = ${requesterId})
    `

    if (existing.length > 0) {
      const friendship = existing[0]
      if (friendship.status === 'accepted') {
        return res.status(400).json({ error: 'Already friends' })
      }
      return res.status(400).json({ error: 'Friend request already exists' })
    }

    const id = uuidv4()
    const now = new Date()

    const friendships = await sql`
      INSERT INTO friendships (id, requester_id, addressee_id, status, created_at, updated_at)
      VALUES (${id}, ${requesterId}, ${addresseeId}, 'pending', ${now}, ${now})
      RETURNING *
    `

    return res.status(201).json({ friendship: friendships[0], message: 'Friend request sent' })
  } catch (error) {
    console.error('Error sending friend request:', error)
    return res.status(500).json({ error: 'Failed to send friend request' })
  }
})

// Accept a friend request
router.patch('/:id/accept', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { userId } = req.body

    // Verify the user is the addressee (only addressee can accept)
    const existing = await sql`
      SELECT * FROM friendships WHERE id = ${id}
    `

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Friend request not found' })
    }

    const friendship = existing[0]

    if (friendship.addressee_id !== userId) {
      return res.status(403).json({ error: 'Only the recipient can accept a friend request' })
    }

    if (friendship.status === 'accepted') {
      return res.status(400).json({ error: 'Friend request already accepted' })
    }

    const now = new Date()

    const updated = await sql`
      UPDATE friendships 
      SET status = 'accepted', updated_at = ${now}
      WHERE id = ${id}
      RETURNING *
    `

    return res.json({ friendship: updated[0], message: 'Friend request accepted' })
  } catch (error) {
    console.error('Error accepting friend request:', error)
    return res.status(500).json({ error: 'Failed to accept friend request' })
  }
})

// Decline a friend request (delete it)
router.delete('/:id/decline', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { userId } = req.body

    // Verify the user is the addressee (only addressee can decline)
    const existing = await sql`
      SELECT * FROM friendships WHERE id = ${id}
    `

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Friend request not found' })
    }

    const friendship = existing[0]

    if (friendship.addressee_id !== userId) {
      return res.status(403).json({ error: 'Only the recipient can decline a friend request' })
    }

    await sql`
      DELETE FROM friendships WHERE id = ${id}
    `

    return res.json({ message: 'Friend request declined' })
  } catch (error) {
    console.error('Error declining friend request:', error)
    return res.status(500).json({ error: 'Failed to decline friend request' })
  }
})

// Cancel a sent friend request (delete it)
router.delete('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { userId } = req.body

    // Verify the user is the requester (only requester can cancel)
    const existing = await sql`
      SELECT * FROM friendships WHERE id = ${id}
    `

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Friend request not found' })
    }

    const friendship = existing[0]

    if (friendship.requester_id !== userId) {
      return res.status(403).json({ error: 'Only the sender can cancel a friend request' })
    }

    if (friendship.status === 'accepted') {
      return res.status(400).json({ error: 'Cannot cancel an accepted friendship. Use remove instead.' })
    }

    await sql`
      DELETE FROM friendships WHERE id = ${id}
    `

    return res.json({ message: 'Friend request cancelled' })
  } catch (error) {
    console.error('Error cancelling friend request:', error)
    return res.status(500).json({ error: 'Failed to cancel friend request' })
  }
})

// Remove a friend (delete accepted friendship)
router.delete('/:id/remove', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { userId } = req.body

    // Verify the user is part of the friendship
    const existing = await sql`
      SELECT * FROM friendships WHERE id = ${id}
    `

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Friendship not found' })
    }

    const friendship = existing[0]

    if (friendship.requester_id !== userId && friendship.addressee_id !== userId) {
      return res.status(403).json({ error: 'You are not part of this friendship' })
    }

    await sql`
      DELETE FROM friendships WHERE id = ${id}
    `

    return res.json({ message: 'Friend removed successfully' })
  } catch (error) {
    console.error('Error removing friend:', error)
    return res.status(500).json({ error: 'Failed to remove friend' })
  }
})

// Check if two users are friends (utility endpoint)
router.get('/are-friends', async (req: Request, res: Response) => {
  try {
    const { userId, otherUserId } = req.query

    if (!userId || !otherUserId) {
      return res.status(400).json({ error: 'Both userId and otherUserId are required' })
    }

    const friendships = await sql`
      SELECT 1 FROM friendships 
      WHERE status = 'accepted'
        AND ((requester_id = ${userId} AND addressee_id = ${otherUserId})
         OR (requester_id = ${otherUserId} AND addressee_id = ${userId}))
      LIMIT 1
    `

    return res.json({ areFriends: friendships.length > 0 })
  } catch (error) {
    console.error('Error checking friendship:', error)
    return res.status(500).json({ error: 'Failed to check friendship' })
  }
})

export default router
