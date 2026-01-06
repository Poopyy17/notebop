import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Archive } from 'lucide-react'
import { updateBoardSettingsApi, trashBoardApi } from '@/api/boards'
import { toast } from '@/lib/toast'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface BoardSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boardId: string
  currentNoteLimit?: number | null
  currentAllowPosting?: boolean
}

export function BoardSettingsModal({
  open,
  onOpenChange,
  boardId,
  currentNoteLimit = 100,
  currentAllowPosting = true,
}: BoardSettingsModalProps) {
  const [noteLimit, setNoteLimit] = useState<number | ''>(currentNoteLimit || 100)
  const [allowPosting, setAllowPosting] = useState(currentAllowPosting)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Update local state when props change
  useEffect(() => {
    setNoteLimit(currentNoteLimit || 100)
    setAllowPosting(currentAllowPosting)
  }, [currentNoteLimit, currentAllowPosting, open])

  // Handle note limit change - allow empty field
  const handleNoteLimitChange = (value: string) => {
    if (value === '') {
      setNoteLimit('')
    } else {
      const numValue = parseInt(value)
      if (!isNaN(numValue)) {
        setNoteLimit(numValue)
      }
    }
  }

  const archiveMutation = useMutation({
    mutationFn: () => trashBoardApi(boardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      toast.success('Board moved to trash')
      onOpenChange(false)
      navigate('/')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to archive board')
    },
  })

  const handleSave = () => {
    // Validate note limit
    const finalNoteLimit = noteLimit === '' ? 100 : noteLimit
    
    if (finalNoteLimit < 1) {
      toast.error('Note limit must be at least 1')
      return
    }
    
    if (finalNoteLimit > 250) {
      toast.error('Note limit cannot exceed 250')
      return
    }
    
    // Update with validated value
    updateBoardSettingsApi(boardId, {
      noteLimit: finalNoteLimit,
      allowPosting: allowPosting,
    })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['boards', 'detail', boardId] })
        toast.success('Board settings updated successfully')
        onOpenChange(false)
      })
      .catch((error: Error) => {
        toast.error(error.message || 'Failed to update board settings')
      })
  }

  const handleArchive = () => {
    setArchiveDialogOpen(true)
  }

  const confirmArchive = () => {
    archiveMutation.mutate()
    setArchiveDialogOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Board Settings</DialogTitle>
          <DialogDescription>
            Manage settings for this board
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Note Limit */}
          <div className="space-y-2">
            <Label htmlFor="note-limit">Note Limit</Label>
            <Input
              id="note-limit"
              type="number"
              min="1"
              max="250"
              value={noteLimit}
              onChange={(e) => handleNoteLimitChange(e.target.value)}
              placeholder="Enter maximum number of notes"
            />
            <p className="text-sm text-muted-foreground">
              Maximum number of notes that can be posted on this board (1-250)
            </p>
          </div>

          <Separator />

          {/* Allow Posting Toggle */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="allow-posting">Allow Note Posting</Label>
              <p className="text-sm text-muted-foreground">
                Users can post notes on this board
              </p>
            </div>
            <Switch
              id="allow-posting"
              checked={allowPosting}
              onCheckedChange={setAllowPosting}
            />
          </div>

          <Separator />

          {/* Archive Board */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Archive Board</Label>
              <p className="text-sm text-muted-foreground">
                Move this board to the trash. You can restore it later.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleArchive}
              className="w-full gap-2"
            >
              <Archive className="size-4" />
              Archive Board
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title="Archive Board"
        description="Are you sure you want to archive this board? The board and all its notes will be moved to trash. You can restore it later from the Trash page."
        confirmLabel="Archive Board"
        variant="destructive"
        isLoading={archiveMutation.isPending}
        onConfirm={confirmArchive}
      />
    </Dialog>
  )
}
