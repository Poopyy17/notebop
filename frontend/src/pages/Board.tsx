import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useBreadcrumb } from '@/contexts/BreadcrumbContext'
import { getBoardApi } from '@/api/boards'
import { useNotesForBoard } from '@/hooks/useNotes'
import { useUser } from '@stackframe/react'
import { Spinner } from '@/components/ui/spinner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NoteEditorModal } from '@/components/notes/NoteEditorModal'
import { NoteList } from '@/components/notes/NoteList'

const Board = () => {
  const { id } = useParams<{ id: string }>()
  const { setBreadcrumbs } = useBreadcrumb()
  const user = useUser()
  const [showEditor, setShowEditor] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['boards', 'detail', id],
    queryFn: () => getBoardApi(id!),
    enabled: !!id,
  })

  const board = data?.board
  const isBoardOwner = board?.user_id === user?.id

  const { data: notes, isLoading: isLoadingNotes } = useNotesForBoard(id)

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
          
          {!isBoardOwner && (
            <Button onClick={() => setShowEditor(true)} className="gap-2">
              <Plus className="size-4" />
              Add Note
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <NoteList notes={notes} isLoading={isLoadingNotes} isBoardOwner={isBoardOwner} />
        </div>
      </Card>

      {!isBoardOwner && (
        <NoteEditorModal
          boardId={board.id}
          open={showEditor}
          onOpenChange={setShowEditor}
        />
      )}
    </div>
  )
}

export default Board