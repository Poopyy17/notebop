import { Router, Request, Response } from 'express'
import { sql } from '../lib/db.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// Board interface
interface Board {
  id: string
  user_id: string
  name: string
  emoji: string | null
  is_private: boolean
  is_favorite: boolean
  note_limit: number | null
  allow_posting: boolean
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
}

// Get all boards for a user (excludes soft-deleted)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const boards = await sql`
      SELECT * FROM boards 
      WHERE user_id = ${userId} AND deleted_at IS NULL
      ORDER BY created_at DESC
    `

    return res.json({ boards })
  } catch (error) {
    console.error('Error fetching boards:', error)
    return res.status(500).json({ error: 'Failed to fetch boards' })
  }
})

// Get boards by type (public or private, excludes soft-deleted)
router.get('/by-type', async (req: Request, res: Response) => {
  try {
    const { userId, isPrivate } = req.query

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const isPrivateBool = isPrivate === 'true'

    const boards = await sql`
      SELECT * FROM boards 
      WHERE user_id = ${userId} AND is_private = ${isPrivateBool} AND deleted_at IS NULL
      ORDER BY created_at DESC
    `

    return res.json({ boards })
  } catch (error) {
    console.error('Error fetching boards by type:', error)
    return res.status(500).json({ error: 'Failed to fetch boards' })
  }
})

// Get another user's boards (respects friendship for private boards)
router.get('/user/:targetUserId', async (req: Request, res: Response) => {
  try {
    const { targetUserId } = req.params
    const { currentUserId } = req.query

    if (!currentUserId || typeof currentUserId !== 'string') {
      return res.status(400).json({ error: 'Current user ID is required' })
    }

    // Check if users are friends
    const friendships = await sql`
      SELECT * FROM friendships 
      WHERE status = 'accepted'
        AND ((requester_id = ${currentUserId} AND addressee_id = ${targetUserId})
          OR (requester_id = ${targetUserId} AND addressee_id = ${currentUserId}))
      LIMIT 1
    `
    const areFriends = friendships.length > 0

    // Fetch public boards (always visible)
    const publicBoards = await sql`
      SELECT * FROM boards 
      WHERE user_id = ${targetUserId} AND is_private = false AND deleted_at IS NULL
      ORDER BY created_at DESC
    `

    // Fetch private boards only if friends
    let privateBoards: typeof publicBoards = []
    if (areFriends) {
      privateBoards = await sql`
        SELECT * FROM boards 
        WHERE user_id = ${targetUserId} AND is_private = true AND deleted_at IS NULL
        ORDER BY created_at DESC
      `
    }

    return res.json({
      publicBoards,
      privateBoards,
      areFriends,
    })
  } catch (error) {
    console.error('Error fetching user boards:', error)
    return res.status(500).json({ error: 'Failed to fetch user boards' })
  }
})

// Get unviewed note counts for all user boards
router.get('/unviewed-counts', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' })
    }

    // Get all boards owned by the user with unviewed note counts
    const counts = await sql`
      SELECT 
        b.id as board_id,
        COUNT(n.id) FILTER (WHERE n.is_viewed = false AND n.deleted_at IS NULL) as unviewed_count
      FROM boards b
      LEFT JOIN notes n ON b.id = n.board_id
      WHERE b.user_id = ${userId} AND b.deleted_at IS NULL
      GROUP BY b.id
    `

    // Convert to a map for easier lookup
    const countsMap = counts.reduce((acc: Record<string, number>, row: any) => {
      acc[row.board_id] = parseInt(row.unviewed_count) || 0
      return acc
    }, {})

    return res.json({ counts: countsMap })
  } catch (error) {
    console.error('Error fetching unviewed counts:', error)
    return res.status(500).json({ error: 'Failed to fetch unviewed counts' })
  }
})

// Get trashed boards for a user
router.get('/trash', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const boards = await sql`
      SELECT * FROM boards 
      WHERE user_id = ${userId} AND deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `

    return res.json({ boards })
  } catch (error) {
    console.error('Error fetching trashed boards:', error)
    return res.status(500).json({ error: 'Failed to fetch trashed boards' })
  }
})

// Get a single board by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const boards = await sql`
      SELECT * FROM boards WHERE id = ${id}
    `

    if (boards.length === 0) {
      return res.status(404).json({ error: 'Board not found' })
    }

    return res.json({ board: boards[0] })
  } catch (error) {
    console.error('Error fetching board:', error)
    return res.status(500).json({ error: 'Failed to fetch board' })
  }
})

// Create a new board
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, name, emoji, isPrivate } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Board name is required' })
    }

    const id = uuidv4()
    const now = new Date()

    const boards = await sql`
      INSERT INTO boards (id, user_id, name, emoji, is_private, created_at, updated_at)
      VALUES (${id}, ${userId}, ${name.trim()}, ${emoji || null}, ${isPrivate ?? false}, ${now}, ${now})
      RETURNING *
    `

    return res.status(201).json({ board: boards[0] })
  } catch (error) {
    console.error('Error creating board:', error)
    return res.status(500).json({ error: 'Failed to create board' })
  }
})

// Update a board
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, emoji, isPrivate, noteLimit, allowPosting } = req.body

    // Check if board exists
    const existingBoards = await sql`
      SELECT * FROM boards WHERE id = ${id}
    `

    if (existingBoards.length === 0) {
      return res.status(404).json({ error: 'Board not found' })
    }

    const now = new Date()

    const boards = await sql`
      UPDATE boards 
      SET 
        name = COALESCE(${name}, name),
        emoji = COALESCE(${emoji}, emoji),
        is_private = COALESCE(${isPrivate}, is_private),
        note_limit = COALESCE(${noteLimit}, note_limit),
        allow_posting = COALESCE(${allowPosting}, allow_posting),
        updated_at = ${now}
      WHERE id = ${id}
      RETURNING *
    `

    return res.json({ board: boards[0] })
  } catch (error) {
    console.error('Error updating board:', error)
    return res.status(500).json({ error: 'Failed to update board' })
  }
})

// Toggle favorite status
router.patch('/:id/favorite', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Check if board exists
    const existingBoards = await sql`
      SELECT * FROM boards WHERE id = ${id}
    `

    if (existingBoards.length === 0) {
      return res.status(404).json({ error: 'Board not found' })
    }

    const currentBoard = existingBoards[0]
    const now = new Date()

    const boards = await sql`
      UPDATE boards 
      SET 
        is_favorite = ${!currentBoard.is_favorite},
        updated_at = ${now}
      WHERE id = ${id}
      RETURNING *
    `

    return res.json({ board: boards[0] })
  } catch (error) {
    console.error('Error toggling favorite:', error)
    return res.status(500).json({ error: 'Failed to toggle favorite' })
  }
})

// Soft delete (move to trash)
router.patch('/:id/trash', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Check if board exists
    const existingBoards = await sql`
      SELECT * FROM boards WHERE id = ${id}
    `

    if (existingBoards.length === 0) {
      return res.status(404).json({ error: 'Board not found' })
    }

    const now = new Date()

    // Soft delete the board
    const boards = await sql`
      UPDATE boards 
      SET 
        deleted_at = ${now},
        updated_at = ${now}
      WHERE id = ${id}
      RETURNING *
    `

    // Soft delete all notes associated with this board in chunks
    const BATCH_SIZE = 50
    let totalNotesDeleted = 0

    while (true) {
      const deletedNotes = await sql`
        UPDATE notes
        SET deleted_at = ${now}
        WHERE id IN (
          SELECT id FROM notes
          WHERE board_id = ${id} 
            AND deleted_at IS NULL
          LIMIT ${BATCH_SIZE}
        )
        RETURNING id
      `

      totalNotesDeleted += deletedNotes.length

      // If we deleted fewer notes than the batch size, we're done
      if (deletedNotes.length < BATCH_SIZE) {
        break
      }
    }

    return res.json({ 
      board: boards[0], 
      message: 'Board moved to trash',
      notesDeleted: totalNotesDeleted
    })
  } catch (error) {
    console.error('Error moving board to trash:', error)
    return res.status(500).json({ error: 'Failed to move board to trash' })
  }
})

// Restore from trash
router.patch('/:id/restore', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Check if board exists
    const existingBoards = await sql`
      SELECT * FROM boards WHERE id = ${id}
    `

    if (existingBoards.length === 0) {
      return res.status(404).json({ error: 'Board not found' })
    }

    const now = new Date()

    // Restore the board
    const boards = await sql`
      UPDATE boards 
      SET 
        deleted_at = NULL,
        updated_at = ${now}
      WHERE id = ${id}
      RETURNING *
    `

    // Restore all notes associated with this board in chunks
    const BATCH_SIZE = 50
    let totalNotesRestored = 0

    while (true) {
      const restoredNotes = await sql`
        UPDATE notes
        SET deleted_at = NULL
        WHERE id IN (
          SELECT id FROM notes
          WHERE board_id = ${id} 
            AND deleted_at IS NOT NULL
          LIMIT ${BATCH_SIZE}
        )
        RETURNING id
      `

      totalNotesRestored += restoredNotes.length

      // If we restored fewer notes than the batch size, we're done
      if (restoredNotes.length < BATCH_SIZE) {
        break
      }
    }

    return res.json({ 
      board: boards[0], 
      message: 'Board restored successfully',
      notesRestored: totalNotesRestored
    })
  } catch (error) {
    console.error('Error restoring board:', error)
    return res.status(500).json({ error: 'Failed to restore board' })
  }
})

// Delete a board
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const boards = await sql`
      DELETE FROM boards WHERE id = ${id}
      RETURNING *
    `

    if (boards.length === 0) {
      return res.status(404).json({ error: 'Board not found' })
    }

    return res.json({ message: 'Board deleted successfully', board: boards[0] })
  } catch (error) {
    console.error('Error deleting board:', error)
    return res.status(500).json({ error: 'Failed to delete board' })
  }
})

// Batch delete boards
router.post('/batch-delete', async (req: Request, res: Response) => {
  try {
    const { ids } = req.body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Board IDs array is required' })
    }

    const deletedBoards = await sql`
      DELETE FROM boards WHERE id = ANY(${ids})
      RETURNING *
    `

    return res.json({ 
      message: `${deletedBoards.length} board(s) deleted successfully`, 
      count: deletedBoards.length 
    })
  } catch (error) {
    console.error('Error batch deleting boards:', error)
    return res.status(500).json({ error: 'Failed to delete boards' })
  }
})

export default router
