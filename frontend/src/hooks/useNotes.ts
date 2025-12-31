import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@stackframe/react'
import {
  getNotesForBoardApi,
  getNoteApi,
  createNoteApi,
  updateNoteReactionApi,
  deleteNoteApi,
} from '@/api/notes'
import { toast } from '@/lib/toast'

export function useNotesForBoard(boardId: string | undefined) {
  return useQuery({
    queryKey: ['notes', 'board', boardId],
    queryFn: () => getNotesForBoardApi(boardId!),
    enabled: !!boardId,
    select: (data) => data.notes,
  })
}

export function useNote(noteId: string | undefined) {
  return useQuery({
    queryKey: ['notes', 'detail', noteId],
    queryFn: () => getNoteApi(noteId!),
    enabled: !!noteId,
    select: (data) => data.note,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createNoteApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes', 'board', data.note.board_id] })
      toast.success('Note created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create note')
    },
  })
}

export function useUpdateNoteReaction() {
  const queryClient = useQueryClient()
  const user = useUser()

  return useMutation({
    mutationFn: ({ noteId, reaction }: { noteId: string; reaction: string | null }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      return updateNoteReactionApi(noteId, { userId: user.id, reaction })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes', 'board', data.note.board_id] })
      queryClient.invalidateQueries({ queryKey: ['notes', 'detail', data.note.id] })
      toast.success('Reaction updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update reaction')
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteNoteApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notes', 'board', data.note.board_id] })
      toast.success('Note deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete note')
    },
  })
}
