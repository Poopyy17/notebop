import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Settings, Share2 } from 'lucide-react'
import { useBreadcrumb } from '@/contexts/BreadcrumbContext'
import { getBoardApi } from '@/api/boards'
import { useNotesForBoard } from '@/hooks/useNotes'
import { useUser } from '@stackframe/react'
import { Spinner } from '@/components/ui/spinner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NoteEditorModal } from '@/components/notes/NoteEditorModal'
import { NoteList } from '@/components/notes/NoteList'
import { BoardSettingsModal } from '@/components/BoardSettingsModal'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from '@/lib/toast'

const Board = () => {
  const { id } = useParams<{ id: string }>()
  const { setBreadcrumbs } = useBreadcrumb()
  const user = useUser()
  const [showEditor, setShowEditor] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['boards', 'detail', id],
    queryFn: () => getBoardApi(id!),
    enabled: !!id,
  })

  const board = data?.board
  const isBoardOwner = board?.user_id === user?.id

  const { data: notes, isLoading: isLoadingNotes } = useNotesForBoard(id)

  // Check if note limit is reached or posting is disabled
  const noteCount = notes?.length || 0
  const isNoteLimitReached = board && board.note_limit !== null && board.note_limit !== undefined && noteCount >= board.note_limit
  const isPostingDisabled = board && board.allow_posting === false
  const canAddNote = !isNoteLimitReached && !isPostingDisabled

  // Get disabled reason for tooltip
  const getDisabledReason = () => {
    if (isPostingDisabled) return 'Posting is currently disabled on this board'
    if (isNoteLimitReached && board) return `Note limit reached (${board.note_limit}/${board.note_limit})`
    return ''
  }

  // Handle share board
  const handleShare = async () => {
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin
    const boardUrl = `${frontendUrl}/board/${id}`
    
    try {
      await navigator.clipboard.writeText(boardUrl)
      toast.success('Board link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link to clipboard')
    }
  }

  useEffect(() => {
    if (board) {
      setBreadcrumbs([
        { label: 'Dashboard', href: '/' },
        { label: board.emoji ? `${board.emoji} ${board.name}` : board.name },
      ])
    }
    return () => setBreadcrumbs([])
  }, [board, setBreadcrumbs])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (error || !board) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-muted-foreground">Board not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col p-4 h-full overflow-hidden">
      <Card className="flex flex-col rounded-xl p-6 h-full overflow-hidden">
        <div className="flex items-center justify-between gap-3 mb-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            {board.emoji && <span className="text-4xl">{board.emoji}</span>}
            <div>
              <h1 className="text-2xl font-bold">{board.name}</h1>
              <p className="text-sm text-muted-foreground">
                {board.is_private ? 'Private Board' : 'Public Board'}
              </p>
            </div>
          </div>
          
          {!isBoardOwner ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button 
                    onClick={() => setShowEditor(true)} 
                    className="gap-2"
                    disabled={!canAddNote}
                  >
                    <Plus className="size-4" />
                    Add Note
                  </Button>
                </span>
              </TooltipTrigger>
              {!canAddNote && (
                <TooltipContent>
                  {getDisabledReason()}
                </TooltipContent>
              )}
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2">
              <Button onClick={handleShare} variant="outline" size="icon">
                <Share2 className="size-4" />
              </Button>
              <Button onClick={() => setShowSettings(true)} variant="outline" className="gap-2">
                <Settings className="size-4" />
                Settings
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <NoteList notes={notes} isLoading={isLoadingNotes} isBoardOwner={isBoardOwner} boardId={id} />
        </div>
      </Card>

      {!isBoardOwner && (
        <NoteEditorModal
          boardId={board.id}
          open={showEditor}
          onOpenChange={setShowEditor}
        />
      )}

      {isBoardOwner && (
        <BoardSettingsModal
          boardId={board.id}
          open={showSettings}
          onOpenChange={setShowSettings}
          currentNoteLimit={board.note_limit}
          currentAllowPosting={board.allow_posting}
        />
      )}
    </div>
  )
}

export default Board