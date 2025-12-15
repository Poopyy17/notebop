const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface Friendship {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted'
  created_at: string
  updated_at: string
}

export interface FriendWithDetails {
  friendship_id: string
  friends_since: string
  id: string
  name: string
  email: string
  profileImageUrl?: string
}

export interface FriendRequest {
  friendship_id: string
  requested_at: string
  id: string
  name: string
  email: string
  profileImageUrl?: string
}

export type FriendshipStatus = 'none' | 'friends' | 'request_sent' | 'request_received'

// Get friendship status between two users
export async function getFriendshipStatusApi(
  userId: string,
  otherUserId: string
): Promise<{ status: FriendshipStatus; friendship: Friendship | null }> {
  const response = await fetch(
    `${API_URL}/api/friendships/status?userId=${userId}&otherUserId=${otherUserId}`
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to get friendship status')
  }

  return response.json()
}

// Get all friends for a user
export async function getFriendsApi(
  userId: string
): Promise<{ friends: FriendWithDetails[] }> {
  const response = await fetch(`${API_URL}/api/friendships/friends?userId=${userId}`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to fetch friends')
  }

  return response.json()
}

// Get incoming friend requests
export async function getIncomingRequestsApi(
  userId: string
): Promise<{ requests: FriendRequest[] }> {
  const response = await fetch(
    `${API_URL}/api/friendships/requests/incoming?userId=${userId}`
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to fetch incoming requests')
  }

  return response.json()
}

// Get outgoing friend requests
export async function getOutgoingRequestsApi(
  userId: string
): Promise<{ requests: FriendRequest[] }> {
  const response = await fetch(
    `${API_URL}/api/friendships/requests/outgoing?userId=${userId}`
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to fetch outgoing requests')
  }

  return response.json()
}

// Send a friend request
export async function sendFriendRequestApi(
  requesterId: string,
  addresseeId: string
): Promise<{ friendship: Friendship; message: string }> {
  const response = await fetch(`${API_URL}/api/friendships/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requesterId, addresseeId }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to send friend request')
  }

  return response.json()
}

// Accept a friend request
export async function acceptFriendRequestApi(
  friendshipId: string,
  userId: string
): Promise<{ friendship: Friendship; message: string }> {
  const response = await fetch(`${API_URL}/api/friendships/${friendshipId}/accept`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to accept friend request')
  }

  return response.json()
}

// Decline a friend request
export async function declineFriendRequestApi(
  friendshipId: string,
  userId: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/api/friendships/${friendshipId}/decline`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to decline friend request')
  }

  return response.json()
}

// Cancel a sent friend request
export async function cancelFriendRequestApi(
  friendshipId: string,
  userId: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/api/friendships/${friendshipId}/cancel`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to cancel friend request')
  }

  return response.json()
}

// Remove a friend
export async function removeFriendApi(
  friendshipId: string,
  userId: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/api/friendships/${friendshipId}/remove`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to remove friend')
  }

  return response.json()
}

// Check if two users are friends
export async function checkAreFriendsApi(
  userId: string,
  otherUserId: string
): Promise<{ areFriends: boolean }> {
  const response = await fetch(
    `${API_URL}/api/friendships/are-friends?userId=${userId}&otherUserId=${otherUserId}`
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to check friendship')
  }

  return response.json()
}
