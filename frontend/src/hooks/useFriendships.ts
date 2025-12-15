import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@stackframe/react'
import {
  getFriendshipStatusApi,
  getFriendsApi,
  getIncomingRequestsApi,
  getOutgoingRequestsApi,
  sendFriendRequestApi,
  acceptFriendRequestApi,
  declineFriendRequestApi,
  cancelFriendRequestApi,
  removeFriendApi,
  checkAreFriendsApi,
} from '@/api/friendships'

// Query key factory
export const friendshipKeys = {
  all: ['friendships'] as const,
  status: (userId: string, otherUserId: string) =>
    [...friendshipKeys.all, 'status', userId, otherUserId] as const,
  friends: (userId: string) => [...friendshipKeys.all, 'friends', userId] as const,
  incomingRequests: (userId: string) =>
    [...friendshipKeys.all, 'incoming', userId] as const,
  outgoingRequests: (userId: string) =>
    [...friendshipKeys.all, 'outgoing', userId] as const,
  areFriends: (userId: string, otherUserId: string) =>
    [...friendshipKeys.all, 'areFriends', userId, otherUserId] as const,
}

// Hook to get friendship status with another user
export function useFriendshipStatus(otherUserId: string | undefined) {
  const user = useUser()

  return useQuery({
    queryKey: friendshipKeys.status(user?.id ?? '', otherUserId ?? ''),
    queryFn: () => getFriendshipStatusApi(user!.id, otherUserId!),
    enabled: !!user?.id && !!otherUserId && user.id !== otherUserId,
  })
}

// Hook to get all friends
export function useFriends() {
  const user = useUser()

  return useQuery({
    queryKey: friendshipKeys.friends(user?.id ?? ''),
    queryFn: () => getFriendsApi(user!.id),
    enabled: !!user?.id,
    select: (data) => data.friends,
  })
}

// Hook to get incoming friend requests
export function useIncomingRequests() {
  const user = useUser()

  return useQuery({
    queryKey: friendshipKeys.incomingRequests(user?.id ?? ''),
    queryFn: () => getIncomingRequestsApi(user!.id),
    enabled: !!user?.id,
    select: (data) => data.requests,
  })
}

// Hook to get outgoing friend requests
export function useOutgoingRequests() {
  const user = useUser()

  return useQuery({
    queryKey: friendshipKeys.outgoingRequests(user?.id ?? ''),
    queryFn: () => getOutgoingRequestsApi(user!.id),
    enabled: !!user?.id,
    select: (data) => data.requests,
  })
}

// Hook to send a friend request
export function useSendFriendRequest() {
  const user = useUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (addresseeId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      return sendFriendRequestApi(user.id, addresseeId)
    },
    onSuccess: (_, addresseeId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: friendshipKeys.all })
      queryClient.invalidateQueries({
        queryKey: friendshipKeys.status(user!.id, addresseeId),
      })
    },
  })
}

// Hook to accept a friend request
export function useAcceptFriendRequest() {
  const user = useUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (friendshipId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      return acceptFriendRequestApi(friendshipId, user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendshipKeys.all })
    },
  })
}

// Hook to decline a friend request
export function useDeclineFriendRequest() {
  const user = useUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (friendshipId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      return declineFriendRequestApi(friendshipId, user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendshipKeys.all })
    },
  })
}

// Hook to cancel a sent friend request
export function useCancelFriendRequest() {
  const user = useUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (friendshipId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      return cancelFriendRequestApi(friendshipId, user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendshipKeys.all })
    },
  })
}

// Hook to remove a friend
export function useRemoveFriend() {
  const user = useUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (friendshipId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      return removeFriendApi(friendshipId, user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendshipKeys.all })
    },
  })
}

// Hook to check if two users are friends
export function useAreFriends(otherUserId: string | undefined) {
  const user = useUser()

  return useQuery({
    queryKey: friendshipKeys.areFriends(user?.id ?? '', otherUserId ?? ''),
    queryFn: () => checkAreFriendsApi(user!.id, otherUserId!),
    enabled: !!user?.id && !!otherUserId,
    select: (data) => data.areFriends,
  })
}
