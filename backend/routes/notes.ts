import { Router, Request, Response } from 'express'
import { sql } from '../lib/db.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

interface Note {
  id: string
  board_id: string
  user_id: string
  body: string
  color: string
  reaction: string | null
  is_anonymous: boolean
  is_viewed: boolean
  position: number
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
}

// Get all notes for a board
router.get('/board/:boardId', async (req: Request, res: Response) => {
  try {
    const { boardId } = req.params

    const notes = await sql`
      SELECT * FROM notes 
      WHERE board_id = ${boardId}
        AND deleted_at IS NULL
      ORDER BY position ASC, created_at DESC
    `

    return res.json({ notes })
  } catch (error) {
    console.error('Error fetching notes:', error)
    return res.status(500).json({ error: 'Failed to fetch notes' })
  }
})

// Get a single note by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const notes = await sql`
      SELECT * FROM notes WHERE id = ${id}
    `

    if (notes.length === 0) {
      return res.status(404).json({ error: 'Note not found' })
    }

    return res.json({ note: notes[0] })
  } catch (error) {
    console.error('Error fetching note:', error)
    return res.status(500).json({ error: 'Failed to fetch note' })
  }
})

// Create a new note
router.post('/', async (req: Request, res: Response) => {
  try {
    const { boardId, userId, body, color, isAnonymous } = req.body

    if (!boardId || !userId) {
      return res.status(400).json({ error: 'Board ID and User ID are required' })
    }

    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      return res.status(400).json({ error: 'Note body is required' })
    }

    if (!color || typeof color !== 'string') {
      return res.status(400).json({ error: 'Note color is required' })
    }

    // Check if board exists
    const boards = await sql`
      SELECT * FROM boards WHERE id = ${boardId}
    `

    if (boards.length === 0) {
      return res.status(404).json({ error: 'Board not found' })
    }

    const board = boards[0]

    // Check if board is deleted (in trash)
    if (board.deleted_at !== null) {
      return res.status(403).json({ error: 'Cannot post notes on a deleted board' })
    }

    // Prevent board owner from creating notes on their own board
    if (board.user_id === userId) {
      return res.status(403).json({ error: 'Board owners cannot create notes on their own boards' })
    }

    // Check if posting is allowed on this board
    if (board.allow_posting === false) {
      return res.status(403).json({ error: 'Posting is currently disabled on this board' })
    }

    // Check if board has reached note limit
    if (board.note_limit !== null) {
      const noteCount = await sql`
        SELECT COUNT(*) as count FROM notes 
        WHERE board_id = ${boardId}
          AND deleted_at IS NULL
      `
      const currentCount = parseInt(noteCount[0].count)
      
      if (currentCount >= board.note_limit) {
        return res.status(403).json({ error: `This board has reached its note limit of ${board.note_limit}` })
      }
    }

    // Check if board is private and user is not a friend
    if (board.is_private) {
      const friendships = await sql`
        SELECT * FROM friendships 
        WHERE status = 'accepted'
          AND ((requester_id = ${userId} AND addressee_id = ${board.user_id})
            OR (requester_id = ${board.user_id} AND addressee_id = ${userId}))
        LIMIT 1
      `

      if (friendships.length === 0) {
        return res.status(403).json({ error: 'You must be friends with the board owner to create notes on private boards' })
      }
    }

    // Get the max position for this board to set new note at the end
    const maxPositionResult = await sql`
      SELECT COALESCE(MAX(position), -1) as max_position
      FROM notes
      WHERE board_id = ${boardId}
        AND deleted_at IS NULL
    `
    const nextPosition = parseInt(maxPositionResult[0].max_position) + 1

    const id = uuidv4()
    const now = new Date()
    const anonymous = isAnonymous === true

    const notes = await sql`
      INSERT INTO notes (id, board_id, user_id, body, color, is_anonymous, position, created_at, updated_at)
      VALUES (${id}, ${boardId}, ${userId}, ${body.trim()}, ${color}, ${anonymous}, ${nextPosition}, ${now}, ${now})
      RETURNING *
    `

    return res.status(201).json({ note: notes[0] })
  } catch (error) {
    console.error('Error creating note:', error)
    return res.status(500).json({ error: 'Failed to create note' })
  }
})

// Update note reaction (board owner only)
router.patch('/:id/reaction', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { userId, reaction } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    // Get the note
    const notes = await sql`
      SELECT * FROM notes WHERE id = ${id}
    `

    if (notes.length === 0) {
      return res.status(404).json({ error: 'Note not found' })
    }

    const note = notes[0]

    // Get the board to verify ownership
    const boards = await sql`
      SELECT * FROM boards WHERE id = ${note.board_id}
    `

    if (boards.length === 0) {
      return res.status(404).json({ error: 'Board not found' })
    }

    const board = boards[0]

    // Only board owner can react
    if (board.user_id !== userId) {
      return res.status(403).json({ error: 'Only the board owner can react to notes' })
    }

    const now = new Date()

    const updatedNotes = await sql`
      UPDATE notes 
      SET 
        reaction = ${reaction || null},
        updated_at = ${now}
      WHERE id = ${id}
      RETURNING *
    `

    return res.json({ note: updatedNotes[0] })
  } catch (error) {
    console.error('Error updating note reaction:', error)
    return res.status(500).json({ error: 'Failed to update note reaction' })
  }
})

// Mark note as viewed (board owner only)
router.patch('/:id/view', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    // Get the note
    const notes = await sql`
      SELECT * FROM notes WHERE id = ${id}
    `

    if (notes.length === 0) {
      return res.status(404).json({ error: 'Note not found' })
    }

    const note = notes[0]

    // Get the board to verify ownership
    const boards = await sql`
      SELECT * FROM boards WHERE id = ${note.board_id}
    `

    if (boards.length === 0) {
      return res.status(404).json({ error: 'Board not found' })
    }

    const board = boards[0]

    // Only board owner can mark notes as viewed
    if (board.user_id !== userId) {
      return res.status(403).json({ error: 'Only the board owner can mark notes as viewed' })
    }

    const now = new Date()

    const updatedNotes = await sql`
      UPDATE notes 
      SET 
        is_viewed = true,
        updated_at = ${now}
      WHERE id = ${id}
      RETURNING *
    `

    return res.json({ note: updatedNotes[0] })
  } catch (error) {
    console.error('Error marking note as viewed:', error)
    return res.status(500).json({ error: 'Failed to mark note as viewed' })
  }
})

// Update note positions (board owner only)
router.patch('/reorder', async (req: Request, res: Response) => {
  try {
    const { userId, boardId, positions } = req.body

    if (!userId || !boardId || !positions || !Array.isArray(positions)) {
      return res.status(400).json({ error: 'User ID, Board ID, and positions array are required' })
    }

    // Get the board to verify ownership
    const boards = await sql`
      SELECT * FROM boards WHERE id = ${boardId}
    `

    if (boards.length === 0) {
      return res.status(404).json({ error: 'Board not found' })
    }

    const board = boards[0]

    // Only board owner can reorder notes
    if (board.user_id !== userId) {
      return res.status(403).json({ error: 'Only the board owner can reorder notes' })
    }

    // Update positions in a transaction
    const now = new Date()
    const updatePromises = positions.map(({ noteId, position }: { noteId: string; position: number }) =>
      sql`
        UPDATE notes
        SET position = ${position}, updated_at = ${now}
        WHERE id = ${noteId} AND board_id = ${boardId}
      `
    )

    await Promise.all(updatePromises)

    return res.json({ message: 'Note positions updated successfully' })
  } catch (error) {
    console.error('Error updating note positions:', error)
    return res.status(500).json({ error: 'Failed to update note positions' })
  }
})

// Delete a note (not allowed per requirements, but keeping for admin purposes)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const notes = await sql`
      DELETE FROM notes WHERE id = ${id}
      RETURNING *
    `

    if (notes.length === 0) {
      return res.status(404).json({ error: 'Note not found' })
    }

    return res.json({ message: 'Note deleted successfully', note: notes[0] })
  } catch (error) {
    console.error('Error deleting note:', error)
    return res.status(500).json({ error: 'Failed to delete note' })
  }
})

export default router
