import { useMatch } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import { ThemeToggle } from "@/components/ThemeToggle"
import { BoardActionsMenu } from "@/components/BoardActionsMenu"
import { FavoriteButton } from "@/components/FavoriteButton"
import { getBoardApi } from "@/api/boards"

export function NavActions() {
  // Use useMatch to get the board ID from the URL since this component is outside the Routes
  const boardMatch = useMatch('/board/:id')
  const boardId = boardMatch?.params.id
  
  // Fetch current board data if we're on a board page
  const { data: boardData } = useQuery({
    queryKey: ['boards', 'detail', boardId],
    queryFn: () => getBoardApi(boardId!),
    enabled: !!boardId,
  })
  
  const board = boardData?.board
  
  // Format last edited date
  const formatLastEdited = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Show last edited date when on a board page */}
      {board && (
        <div className="text-muted-foreground hidden font-medium md:inline-block">
          Last Edited on {formatLastEdited(board.updated_at)}
        </div>
      )}
      
      <ThemeToggle />

      {/* Show favorite toggle and actions menu when on a board page */}
      {board && (
        <>
          <FavoriteButton 
            boardId={board.id} 
            isFavorite={board.is_favorite} 
            variant="header" 
          />
          <BoardActionsMenu 
            board={board} 
            variant="header"
            side="bottom"
            align="end"
          />
        </>
      )}
    </div>
  )
}
