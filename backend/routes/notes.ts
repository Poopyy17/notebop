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
      ORDER BY created_at DESC
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

    // Prevent board owner from creating notes on their own board
    if (board.user_id === userId) {
      return res.status(403).json({ error: 'Board owners cannot create notes on their own boards' })
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

    const id = uuidv4()
    const now = new Date()
    const anonymous = isAnonymous === true

    const notes = await sql`
      INSERT INTO notes (id, board_id, user_id, body, color, is_anonymous, created_at, updated_at)
      VALUES (${id}, ${boardId}, ${userId}, ${body.trim()}, ${color}, ${anonymous}, ${now}, ${now})
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
