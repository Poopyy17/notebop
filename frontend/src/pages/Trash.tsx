import { useEffect, useState } from 'react'
import { useBreadcrumb } from '@/contexts/BreadcrumbContext'
import { useTrashedBoards, useRestoreBoard, useDeleteBoard, useBatchDeleteBoards } from '@/hooks/useBoards'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { 
  Empty, 
  EmptyHeader, 
  EmptyMedia, 
  EmptyTitle, 
  EmptyDescription 
} from '@/components/ui/empty'
import { Trash2, RotateCcw } from 'lucide-react'
import { toast } from '@/lib/toast'
import type { Board } from '@/api/boards'

export default function Trash() {
  const { setBreadcrumbs } = useBreadcrumb()
  const { data: boards = [], isLoading } = useTrashedBoards()
  const restoreBoard = useRestoreBoard()
  const deleteBoard = useDeleteBoard()
  const batchDeleteBoards = useBatchDeleteBoards()
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false)
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/' },
      { label: 'Trash' }
    ])
  }, [setBreadcrumbs])

  const handleRestore = async (board: Board) => {
    try {
      await restoreBoard.mutateAsync(board.id)
      toast.success(`"${board.name}" restored successfully`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to restore board')
    }
  }

  const handleDeletePermanently = async () => {
    if (!boardToDelete) return
    try {
      await deleteBoard.mutateAsync(boardToDelete.id)
      toast.success(`"${boardToDelete.name}" deleted permanently`)
      setDeleteDialogOpen(false)
      setBoardToDelete(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete board')
    }
  }

  const openDeleteDialog = (board: Board) => {
    setBoardToDelete(board)
    setDeleteDialogOpen(true)
  }

  const formatDeletedOn = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === boards.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(boards.map(b => b.id))
    }
  }

  const handleBatchDelete = async () => {
    try {
      await batchDeleteBoards.mutateAsync(selectedIds)
      toast.success(`${selectedIds.length} board(s) deleted permanently`)
      setBatchDeleteDialogOpen(false)
      setSelectedIds([])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete boards')
    }
  }


  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trash2 className="h-6 w-6" />
            Trash
          </h1>
          <p className="text-muted-foreground">
            Boards you've moved to trash. You can restore them or delete them permanently.
          </p>
        </div>
        {boards.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
            >
              {selectedIds.length === boards.length ? 'Deselect All' : 'Select All'}
            </Button>
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBatchDeleteDialogOpen(true)}
              >
                Delete Selected ({selectedIds.length})
              </Button>
            )}
          </div>
        )}
      </div>

      {boards.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Trash2 />
            </EmptyMedia>
            <EmptyTitle>Trash is empty</EmptyTitle>
            <EmptyDescription>Boards you delete will appear here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <Card 
              key={board.id} 
              className={`p-4 cursor-pointer transition-colors ${
                selectedIds.includes(board.id) ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => toggleSelect(board.id)}
            >
              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={selectedIds.includes(board.id)}
                  onCheckedChange={() => toggleSelect(board.id)}
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {board.emoji && <span className="text-2xl">{board.emoji}</span>}
                    <div>
                      <h3 className="font-medium">{board.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {board.is_private ? 'Private' : 'Public'} Board
                      </p>
                      {board.deleted_at && (
                        <p className="text-xs text-muted-foreground">
                          Deleted on {formatDeletedOn(board.deleted_at)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRestore(board)
                      }}
                      disabled={restoreBoard.isPending}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restore
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        openDeleteDialog(board)
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Confirm permanent delete dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Permanently"
        description={`Are you sure you want to permanently delete "${boardToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        variant="destructive"
        isLoading={deleteBoard.isPending}
        onConfirm={handleDeletePermanently}
      />

      {/* Confirm batch delete dialog */}
      <ConfirmDialog
        open={batchDeleteDialogOpen}
        onOpenChange={setBatchDeleteDialogOpen}
        title="Delete Selected Boards"
        description={`Are you sure you want to permanently delete ${selectedIds.length} board(s)? This action cannot be undone.`}
        confirmLabel={`Delete ${selectedIds.length} Board(s)`}
        variant="destructive"
        isLoading={batchDeleteBoards.isPending}
        onConfirm={handleBatchDelete}
      />
    </div>
  )
}
