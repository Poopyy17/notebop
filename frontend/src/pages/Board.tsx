import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Layers } from 'lucide-react'
import { useBreadcrumb } from '@/contexts/BreadcrumbContext'
import { getBoardApi } from '@/api/boards'
import { Spinner } from '@/components/ui/spinner'
import { Card } from '@/components/ui/card'
import { 
  Empty, 
  EmptyHeader, 
  EmptyMedia, 
  EmptyTitle, 
  EmptyDescription 
} from '@/components/ui/empty'

const Board = () => {
  const { id } = useParams<{ id: string }>()
  const { setBreadcrumbs } = useBreadcrumb()

  const { data, isLoading, error } = useQuery({
    queryKey: ['boards', 'detail', id],
    queryFn: () => getBoardApi(id!),
    enabled: !!id,
  })

  const board = data?.board

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
    <div className="flex flex-1 flex-col p-4">
      <Card className="h-full w-full rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          {board.emoji && <span className="text-4xl">{board.emoji}</span>}
          <div>
            <h1 className="text-2xl font-bold">{board.name}</h1>
            <p className="text-sm text-muted-foreground">
              {board.is_private ? 'Private Board' : 'Public Board'}
            </p>
          </div>
        </div>
        {/* Empty state - will be replaced with actual board content */}
        <Empty className="flex-1">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Layers />
            </EmptyMedia>
            <EmptyTitle>No content yet</EmptyTitle>
            <EmptyDescription>
              Start adding content to your board
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Card>
    </div>
  )
}

export default Board