import { useState } from 'react'
import EmojiPicker from 'emoji-picker-react'
import { Smile, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useUpdateNoteReaction } from '@/hooks/useNotes'
import { getUserApi } from '@/api/users'
import { useQuery } from '@tanstack/react-query'
import type { Note } from '@/api/notes'

interface NoteViewModalProps {
  note: Note | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isBoardOwner: boolean
}

export function NoteViewModal({ note, open, onOpenChange, isBoardOwner }: NoteViewModalProps) {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const updateReaction = useUpdateNoteReaction()

  const { data: noteCreator } = useQuery({
    queryKey: ['users', note?.user_id],
    queryFn: () => getUserApi(note!.user_id),
    enabled: !!note?.user_id,
    select: (data) => data.user,
  })

  const handleEmojiClick = (emojiData: any) => {
    if (!note) return
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

  if (!note) return null

  const timeAgo = getTimeAgo(note.created_at)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" style={{ backgroundColor: note.color }}>
        <DialogHeader>
          <div className="flex items-start gap-3">
            {note.is_anonymous ? (
              <Avatar className="size-10 flex-shrink-0">
                <AvatarFallback className="bg-gray-300">
                  <User className="size-5 text-gray-600" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="size-10 flex-shrink-0">
                <AvatarImage src={noteCreator?.profileImageUrl} alt={noteCreator?.name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {noteCreator?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex flex-col min-w-0">
              <DialogTitle className="text-gray-900 dark:text-gray-900">
                {note.is_anonymous ? 'Anonymous' : (noteCreator?.name || 'Unknown User')}
              </DialogTitle>
              <span className="text-sm text-gray-700">{timeAgo}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            {isBoardOwner && (
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
            )}

            {!isBoardOwner && note.reaction && (
              <div className="text-lg" title="Board owner's reaction">
                {note.reaction}
              </div>
            )}
          </div>

          <div
            className="prose prose-sm max-w-none bg-white/80 rounded-lg p-4 text-gray-900"
            dangerouslySetInnerHTML={{ __html: note.body }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
