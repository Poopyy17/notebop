const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface Note {
  id: string
  board_id: string
  user_id: string
  body: string
  color: string
  reaction: string | null
  is_anonymous: boolean
  created_at: string
  updated_at: string
}

export interface CreateNoteParams {
  boardId: string
  userId: string
  body: string
  color: string
  isAnonymous: boolean
}

export interface UpdateReactionParams {
  userId: string
  reaction: string | null
}

export async function getNotesForBoardApi(boardId: string): Promise<{ notes: Note[] }> {
  const response = await fetch(`${API_URL}/api/notes/board/${boardId}`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to fetch notes')
  }

  return response.json()
}

export async function getNoteApi(id: string): Promise<{ note: Note }> {
  const response = await fetch(`${API_URL}/api/notes/${id}`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to fetch note')
  }

  return response.json()
}

export async function createNoteApi(params: CreateNoteParams): Promise<{ note: Note }> {
  const response = await fetch(`${API_URL}/api/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to create note')
  }

  return response.json()
}

export async function updateNoteReactionApi(
  noteId: string,
  params: UpdateReactionParams
): Promise<{ note: Note }> {
  const response = await fetch(`${API_URL}/api/notes/${noteId}/reaction`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to update reaction')
  }

  return response.json()
}

export async function deleteNoteApi(id: string): Promise<{ message: string; note: Note }> {
  const response = await fetch(`${API_URL}/api/notes/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to delete note')
  }

  return response.json()
}
