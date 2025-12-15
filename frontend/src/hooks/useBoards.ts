import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@stackframe/react'
import {
  getBoardsByTypeApi,
  getTrashedBoardsApi,
  createBoardApi,
  updateBoardApi,
  deleteBoardApi,
  batchDeleteBoardsApi,
  toggleFavoriteBoardApi,
  trashBoardApi,
  restoreBoardApi,
  getUserBoardsApi,
} from '@/api/boards'
import type { CreateBoardParams, UpdateBoardParams } from '@/api/boards'

// Query key factory
export const boardKeys = {
  all: ['boards'] as const,
  byType: (userId: string, isPrivate: boolean) =>
    [...boardKeys.all, 'byType', userId, isPrivate] as const,
  trash: (userId: string) => [...boardKeys.all, 'trash', userId] as const,
  detail: (id: string) => [...boardKeys.all, 'detail', id] as const,
  userBoards: (targetUserId: string, currentUserId: string) =>
    [...boardKeys.all, 'user', targetUserId, currentUserId] as const,
}

// Hook to get public boards
export function usePublicBoards() {
  const user = useUser()

  return useQuery({
    queryKey: boardKeys.byType(user?.id ?? '', false),
    queryFn: () => getBoardsByTypeApi(user!.id, false),
    enabled: !!user?.id,
    select: (data) => data.boards,
  })
}

// Hook to get private boards
export function usePrivateBoards() {
  const user = useUser()

  return useQuery({
    queryKey: boardKeys.byType(user?.id ?? '', true),
    queryFn: () => getBoardsByTypeApi(user!.id, true),
    enabled: !!user?.id,
    select: (data) => data.boards,
  })
}

// Hook to create a board
export function useCreateBoard() {
  const user = useUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: Omit<CreateBoardParams, 'userId'>) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      return createBoardApi({ ...params, userId: user.id })
    },
    onSuccess: (data) => {
      // Invalidate the appropriate board list based on privacy
      queryClient.invalidateQueries({
        queryKey: boardKeys.byType(user!.id, data.board.is_private),
      })
    },
  })
}

// Hook to update a board
export function useUpdateBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...params }: UpdateBoardParams & { id: string }) => {
      return updateBoardApi(id, params)
    },
    onSuccess: () => {
      // Invalidate all board queries since privacy might have changed
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
    },
  })
}

// Hook to delete a board (permanent)
export function useDeleteBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => {
      return deleteBoardApi(id)
    },
    onSuccess: () => {
      // Invalidate all board queries
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
    },
  })
}

// Hook to get trashed boards
export function useTrashedBoards() {
  const user = useUser()

  return useQuery({
    queryKey: boardKeys.trash(user?.id ?? ''),
    queryFn: () => getTrashedBoardsApi(user!.id),
    enabled: !!user?.id,
    select: (data) => data.boards,
  })
}

// Hook to toggle favorite status
export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => {
      return toggleFavoriteBoardApi(id)
    },
    onSuccess: () => {
      // Invalidate all board queries since favorite status changed
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
    },
  })
}

// Hook to move board to trash (soft delete)
export function useTrashBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => {
      return trashBoardApi(id)
    },
    onSuccess: () => {
      // Invalidate all board queries
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
    },
  })
}

// Hook to restore board from trash
export function useRestoreBoard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => {
      return restoreBoardApi(id)
    },
    onSuccess: () => {
      // Invalidate all board queries
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
    },
  })
}

// Hook to batch delete boards (permanent)
export function useBatchDeleteBoards() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => {
      return batchDeleteBoardsApi(ids)
    },
    onSuccess: () => {
      // Invalidate all board queries
      queryClient.invalidateQueries({ queryKey: boardKeys.all })
    },
  })
}

// Hook to get another user's boards (respects friendship for private boards)
export function useUserBoards(targetUserId: string | undefined) {
  const user = useUser()

  return useQuery({
    queryKey: boardKeys.userBoards(targetUserId ?? '', user?.id ?? ''),
    queryFn: () => getUserBoardsApi(targetUserId!, user!.id),
    enabled: !!targetUserId && !!user?.id,
  })
}
