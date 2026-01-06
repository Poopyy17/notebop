import { useState } from 'react'
import EmojiPicker from 'emoji-picker-react'
import { Smile, User } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useUpdateNoteReaction } from '@/hooks/useNotes'
import { useUser as useStackUser } from '@stackframe/react'
import { getUserApi } from '@/api/users'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NoteViewModal } from './NoteViewModal'
import { markNoteAsViewedApi } from '@/api/notes'
import { boardKeys } from '@/hooks/useBoards'
import type { Note } from '@/api/notes'

interface NoteCardProps {
  note: Note
  isBoardOwner: boolean
}

export function NoteCard({ note, isBoardOwner }: NoteCardProps) {
  const stackUser = useStackUser()
  const queryClient = useQueryClient()
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const updateReaction = useUpdateNoteReaction()

  // DND-kit sortable hook (only for board owners)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id, disabled: !isBoardOwner })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
  }

  const { data: noteCreator } = useQuery({
    queryKey: ['users', note.user_id],
    queryFn: () => getUserApi(note.user_id),
    select: (data) => data.user,
  })

  const markAsViewedMutation = useMutation({
    mutationFn: () => markNoteAsViewedApi(note.id, stackUser?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', 'board', note.board_id] })
      // Invalidate unviewed counts to update sidebar badge
      if (stackUser?.id) {
        queryClient.invalidateQueries({ queryKey: boardKeys.unviewedCounts(stackUser.id) })
      }
    },
  })

  const handleNoteClick = () => {
    setIsViewModalOpen(true)
    // Mark as viewed when board owner clicks the note
    if (isBoardOwner && !note.is_viewed && stackUser?.id) {
      markAsViewedMutation.mutate()
    }
  }

  const handleEmojiClick = (emojiData: any) => {
    updateReaction.mutate(
      { noteId: note.id, reaction: emojiData.emoji },
      {
        onSuccess: () => {
          setIsEmojiPickerOpen(false)
        },
      }
    )
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months}mo ago`
    const years = Math.floor(months / 12)
    return `${years}y ago`
  }

  const timeAgo = getTimeAgo(note.created_at)

  return (
    <>
      <Card
        ref={setNodeRef}
        style={{ ...style, backgroundColor: note.color }}
        className="aspect-square p-4 flex flex-col transition-shadow hover:shadow-md relative"
      >
        {/* Unviewed indicator - small red dot at top-right corner for board owner */}
        {isBoardOwner && !note.is_viewed && (
          <div className="absolute top-2 right-2 size-2 bg-blue-600 rounded-full animate-pulse" title="Unviewed note" />
        )}

        {/* Top section: Avatar, Name, Time, Reaction - Drag Handle for Board Owner */}
        <div 
          className="flex items-start justify-between gap-2 mb-3"
          {...(isBoardOwner ? { ...attributes, ...listeners } : {})}
          style={{ cursor: isBoardOwner ? 'grab' : 'default' }}
        >
          <div className="flex items-start gap-2">
            {note.is_anonymous ? (
              <Avatar className="size-8 flex-shrink-0">
                <AvatarFallback className="bg-gray-300">
                  <User className="size-4 text-gray-600" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="size-8 flex-shrink-0">
                <AvatarImage src={noteCreator?.profileImageUrl} alt={noteCreator?.name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {noteCreator?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-gray-900 truncate">
                {note.is_anonymous ? 'Anonymous' : (noteCreator?.name || 'Unknown User')}
              </span>
              <span className="text-xs text-gray-700">{timeAgo}</span>
            </div>
          </div>

          {isBoardOwner && (
            <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
              <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 hover:bg-background/50"
                    title={note.reaction ? "Change reaction" : "Add reaction"}
                  >
                    {note.reaction ? (
                      <span className="text-lg">{note.reaction}</span>
                    ) : (
                      <Smile className="size-4" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-0" align="end">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {!isBoardOwner && note.reaction && (
            <div className="text-lg" title="Board owner's reaction">
              {note.reaction}
            </div>
          )}
        </div>

        {/* Bottom section: Body (clickable) */}
        <div
          className="flex-1 bg-white/80 rounded-lg p-3 cursor-pointer hover:bg-white/90 transition-colors overflow-hidden"
          onClick={handleNoteClick}
        >
          <div
            className="prose prose-sm max-w-none line-clamp-6 text-gray-900"
            dangerouslySetInnerHTML={{ __html: note.body }}
          />
        </div>
      </Card>

      <NoteViewModal
        note={note}
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        isBoardOwner={isBoardOwner}
      />
    </>
  )
}
