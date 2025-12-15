import { useState } from 'react'
import {
  Edit,
  Star,
  StarOff,
  Trash2,
  MoreHorizontal,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { SidebarMenuAction } from '@/components/ui/sidebar'
import { BoardDialog } from '@/components/BoardDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useToggleFavorite, useTrashBoard } from '@/hooks/useBoards'
import { toast } from '@/lib/toast'
import type { Board } from '@/api/boards'

interface BoardActionsMenuProps {
  board: Board
  /** Render mode: 'sidebar' uses SidebarMenuAction with showOnHover, 'header' uses a Button */
  variant?: 'sidebar' | 'header'
  /** Side for dropdown positioning */
  side?: 'top' | 'right' | 'bottom' | 'left'
  /** Alignment for dropdown positioning */
  align?: 'start' | 'center' | 'end'
  /** Whether this is on mobile (affects positioning) */
  isMobile?: boolean
}

export function BoardActionsMenu({
  board,
  variant = 'sidebar',
  side,
  align,
  isMobile = false,
}: BoardActionsMenuProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [trashDialogOpen, setTrashDialogOpen] = useState(false)
  
  const toggleFavorite = useToggleFavorite()
  const trashBoard = useTrashBoard()

  const handleToggleFavorite = async () => {
    try {
      await toggleFavorite.mutateAsync(board.id)
      toast.success(
        board.is_favorite 
          ? 'Board removed from favorites' 
          : 'Board added to favorites'
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update favorite status')
    }
  }

  const handleMoveToTrash = async () => {
    try {
      await trashBoard.mutateAsync(board.id)
      toast.success('Board moved to trash')
      setTrashDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to move board to trash')
    }
  }

  // Determine dropdown positioning based on variant and mobile state
  const dropdownSide = side ?? (isMobile ? 'bottom' : variant === 'sidebar' ? 'right' : 'bottom')
  const dropdownAlign = align ?? (isMobile ? 'end' : 'start')

  const TriggerComponent = variant === 'sidebar' ? (
    <SidebarMenuAction showOnHover>
      <MoreHorizontal />
      <span className="sr-only">More</span>
    </SidebarMenuAction>
  ) : (
    <Button variant="ghost" size="icon" className="h-7 w-7">
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More</span>
    </Button>
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {TriggerComponent}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-56 rounded-lg"
          side={dropdownSide}
          align={dropdownAlign}
        >
          <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
            <Edit className="text-muted-foreground" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleToggleFavorite}>
            {board.is_favorite ? (
              <>
                <StarOff className="text-muted-foreground" />
                <span>Remove from Favorites</span>
              </>
            ) : (
              <>
                <Star className="text-muted-foreground" />
                <span>Add to Favorites</span>
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setTrashDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="text-destructive" />
            <span>Move to Trash</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Board Dialog */}
      <BoardDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        isPrivate={board.is_private}
        mode="edit"
        board={board}
      />

      {/* Confirm Trash Dialog */}
      <ConfirmDialog
        open={trashDialogOpen}
        onOpenChange={setTrashDialogOpen}
        title="Move to Trash"
        description={`Are you sure you want to move "${board.name}" to trash? You can restore it later from the trash.`}
        confirmLabel="Move to Trash"
        variant="destructive"
        isLoading={trashBoard.isPending}
        onConfirm={handleMoveToTrash}
      />
    </>
  )
}
