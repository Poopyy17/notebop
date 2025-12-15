import { useQuery } from '@tanstack/react-query'
import { useUser } from '@stackframe/react'
import { searchUsersApi, getUserApi, getSuggestedUsersApi } from '@/api/users'

// Query key factory
export const userKeys = {
  all: ['users'] as const,
  search: (query: string) => [...userKeys.all, 'search', query] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
  suggestions: (userId: string) => [...userKeys.all, 'suggestions', userId] as const,
}

// Hook to search users by name
export function useSearchUsers(query: string) {
  const user = useUser()

  return useQuery({
    queryKey: userKeys.search(query),
    queryFn: () => searchUsersApi(query, user!.id),
    enabled: !!user?.id && query.trim().length > 0,
    select: (data) => data.users,
  })
}

// Hook to get a single user by ID
export function useGetUser(userId: string | undefined) {
  return useQuery({
    queryKey: userKeys.detail(userId ?? ''),
    queryFn: () => getUserApi(userId!),
    enabled: !!userId,
    select: (data) => data.user,
  })
}

// Hook to get suggested friends
export function useSuggestedUsers(enabled: boolean = true) {
  const user = useUser()

  return useQuery({
    queryKey: userKeys.suggestions(user?.id ?? ''),
    queryFn: () => getSuggestedUsersApi(user!.id, 10),
    enabled: !!user?.id && enabled,
    select: (data) => data.users,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}
