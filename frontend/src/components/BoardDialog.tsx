import { useState, useRef, useEffect } from 'react'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import type { EmojiClickData } from 'emoji-picker-react'
import { SmilePlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { useCreateBoard, useUpdateBoard } from '@/hooks/useBoards'
import { toast } from '@/lib/toast'
import { useTheme } from 'next-themes'
import type { Board } from '@/api/boards'

interface BoardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isPrivate: boolean
  mode?: 'create' | 'edit'
  board?: Board | null
}

export function BoardDialog({ 
  open, 
  onOpenChange, 
  isPrivate, 
  mode = 'create',
  board = null 
}: BoardDialogProps) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const createBoard = useCreateBoard()
  const updateBoard = useUpdateBoard()
  const { resolvedTheme } = useTheme()

  const isEditMode = mode === 'edit'
  const isLoading = createBoard.isPending || updateBoard.isPending

  // Pre-fill form when editing
  useEffect(() => {
    if (isEditMode && board) {
      setName(board.name)
      setEmoji(board.emoji || '')
    } else if (!open) {
      // Reset form when dialog closes
      setName('')
      setEmoji('')
    }
  }, [isEditMode, board, open])

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setEmoji(emojiData.emoji)
    setShowEmojiPicker(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Board name is required')
      return
    }

    try {
      if (isEditMode && board) {
        await updateBoard.mutateAsync({
          id: board.id,
          name: name.trim(),
          emoji: emoji || null,
        })
        toast.success('Board updated successfully!')
      } else {
        await createBoard.mutateAsync({
          name: name.trim(),
          emoji: emoji || null,
          isPrivate,
        })
        toast.success(`${isPrivate ? 'Private' : 'Public'} board created successfully!`)
      }
      handleClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} board`)
    }
  }

  const handleClose = () => {
    setName('')
    setEmoji('')
    setShowEmojiPicker(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Board' : `Add New ${isPrivate ? 'Private' : 'Public'} Board`}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the name and emoji for your board.'
              : `Create a new ${isPrivate ? 'private' : 'public'} board to organize your notes.${isPrivate ? ' Private boards are only visible to you.' : ' Public boards can be shared with others.'}`
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Emoji picker + Name input in one row */}
            <div className="flex items-center gap-2">
              <div className="relative" ref={emojiPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-10 h-10 text-xl rounded-md border border-input bg-background hover:bg-muted transition-colors flex items-center justify-center"
                >
                  {emoji || <SmilePlus className="w-5 h-5 text-muted-foreground" />}
                </button>
                {showEmojiPicker && (
                  <div className="absolute top-12 left-0 z-50">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      theme={resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT}
                      width={300}
                      height={400}
                    />
                  </div>
                )}
              </div>
              <Input
                id="name"
                placeholder="Write your own"
                value={name}
                onChange={(e) => {
                  const value = e.target.value
                  setName(value.charAt(0).toUpperCase() + value.slice(1))
                }}
                maxLength={15}
                autoFocus
                className="flex-1"
              />
            </div>
            <div className="text-xs text-muted-foreground text-right">
              {name.length}/15
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner />
                  {isEditMode ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                isEditMode ? 'Save Changes' : 'Create Board'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
