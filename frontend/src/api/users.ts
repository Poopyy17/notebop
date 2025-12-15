const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface User {
  id: string
  name: string
  email: string
  profileImageUrl?: string
}

// Search users by name
export async function searchUsersApi(
  query: string,
  userId: string
): Promise<{ users: User[] }> {
  const response = await fetch(
    `${API_URL}/api/users/search?query=${encodeURIComponent(query)}&userId=${userId}`
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to search users')
  }

  return response.json()
}

// Get a single user by ID
export async function getUserApi(id: string): Promise<{ user: User }> {
  const response = await fetch(`${API_URL}/api/users/${id}`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to fetch user')
  }

  return response.json()
}

// Get suggested friends (random users excluding existing relationships)
export async function getSuggestedUsersApi(
  userId: string,
  limit: number = 10
): Promise<{ users: User[] }> {
  const response = await fetch(
    `${API_URL}/api/users/suggestions?userId=${userId}&limit=${limit}`
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to fetch suggested users')
  }

  return response.json()
}
