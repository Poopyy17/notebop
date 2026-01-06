const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface Board {
  id: string
  user_id: string
  name: string
  emoji: string | null
  is_private: boolean
  is_favorite: boolean
  note_limit: number | null
  allow_posting: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateBoardParams {
  userId: string
  name: string
  emoji?: string | null
  isPrivate: boolean
}

export interface UpdateBoardParams {
  name?: string
  emoji?: string | null
  isPrivate?: boolean
  noteLimit?: number | null
  allowPosting?: boolean
}

// Get all boards for a user
export async function getBoardsApi(userId: string): Promise<{ boards: Board[] }> {
  const response = await fetch(`${API_URL}/api/boards?userId=${userId}`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to fetch boards')
  }

  return response.json()
}

// Get boards by type (public or private)
export async function getBoardsByTypeApi(
  userId: string,
  isPrivate: boolean
): Promise<{ boards: Board[] }> {
  const response = await fetch(
    `${API_URL}/api/boards/by-type?userId=${userId}&isPrivate=${isPrivate}`
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to fetch boards')
  }

  return response.json()
}

// Get a single board by ID
export async function getBoardApi(id: string): Promise<{ board: Board }> {
  const response = await fetch(`${API_URL}/api/boards/${id}`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to fetch board')
  }

  return response.json()
}

// Create a new board
export async function createBoardApi(
  params: CreateBoardParams
): Promise<{ board: Board }> {
  const response = await fetch(`${API_URL}/api/boards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to create board')
  }

  return response.json()
}

// Update a board
export async function updateBoardApi(
  id: string,
  params: UpdateBoardParams
): Promise<{ board: Board }> {
  const response = await fetch(`${API_URL}/api/boards/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to update board')
  }

  return response.json()
}

// Delete a board (permanent)
export async function deleteBoardApi(
  id: string
): Promise<{ message: string; board: Board }> {
  const response = await fetch(`${API_URL}/api/boards/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to delete board')
  }

  return response.json()
}

// Get trashed boards
export async function getTrashedBoardsApi(
  userId: string
): Promise<{ boards: Board[] }> {
  const response = await fetch(`${API_URL}/api/boards/trash?userId=${userId}`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to fetch trashed boards')
  }

  return response.json()
}

// Toggle favorite status
export async function toggleFavoriteBoardApi(
  id: string
): Promise<{ board: Board }> {
  const response = await fetch(`${API_URL}/api/boards/${id}/favorite`, {
    method: 'PATCH',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to toggle favorite')
  }

  return response.json()
}

// Move board to trash (soft delete)
export async function trashBoardApi(
  id: string
): Promise<{ board: Board; message: string }> {
  const response = await fetch(`${API_URL}/api/boards/${id}/trash`, {
    method: 'PATCH',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to move board to trash')
  }

  return response.json()
}

// Restore board from trash
export async function restoreBoardApi(
  id: string
): Promise<{ board: Board; message: string }> {
  const response = await fetch(`${API_URL}/api/boards/${id}/restore`, {
    method: 'PATCH',
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to restore board')
  }

  return response.json()
}

// Batch delete boards (permanent)
export async function batchDeleteBoardsApi(
  ids: string[]
): Promise<{ message: string; count: number }> {
  const response = await fetch(`${API_URL}/api/boards/batch-delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to delete boards')
  }

  return response.json()
}

// Get another user's boards (respects friendship for private boards)
export interface UserBoardsResponse {
  publicBoards: Board[]
  privateBoards: Board[]
  areFriends: boolean
}

export async function getUserBoardsApi(
  targetUserId: string,
  currentUserId: string
): Promise<UserBoardsResponse> {
  const response = await fetch(
    `${API_URL}/api/boards/user/${targetUserId}?currentUserId=${currentUserId}`
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to fetch user boards')
  }

  return response.json()
}

// Update board settings (note limit and allow posting)
export interface UpdateBoardSettingsParams {
  noteLimit?: number | null
  allowPosting?: boolean
}

export async function updateBoardSettingsApi(
  id: string,
  params: UpdateBoardSettingsParams
): Promise<{ board: Board }> {
  const response = await fetch(`${API_URL}/api/boards/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to update board settings')
  }

  return response.json()
}

// Get unviewed note counts for all user boards
export async function getUnviewedCountsApi(userId: string): Promise<{ counts: Record<string, number> }> {
  const response = await fetch(`${API_URL}/api/boards/unviewed-counts?userId=${userId}`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to fetch unviewed counts')
  }

  return response.json()
}
