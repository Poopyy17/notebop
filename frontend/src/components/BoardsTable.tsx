import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Board } from '@/api/boards'

export type ViewMode = 'list' | 'grid'

interface BoardsTableProps {
  boards: Board[]
  viewMode: ViewMode
  emptyMessage?: string
  emptyDescription?: string
}

interface ViewToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex border rounded-md">
      <Button
        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
        size="sm"
        className="rounded-l-none h-7 px-2"
        onClick={() => onViewModeChange('grid')}
      >
        <LayoutGrid className="size-4" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
        size="sm"
        className="rounded-r-none h-7 px-2"
        onClick={() => onViewModeChange('list')}
      >
        <List className="size-4" />
      </Button>
    </div>
  )
}

const columnHelper = createColumnHelper<Board>()

const columns = [
  columnHelper.accessor((row) => ({ emoji: row.emoji, name: row.name }), {
    id: 'name',
    header: 'Name',
    cell: (info) => {
      const { emoji, name } = info.getValue()
      return (
        <div className="flex items-center gap-2">
          {emoji && <span className="text-lg">{emoji}</span>}
          <span className="font-medium">{name}</span>
        </div>
      )
    },
  }),
  columnHelper.accessor('created_at', {
    header: 'Created',
    cell: (info) => {
      const date = new Date(info.getValue())
      return date.toLocaleDateString()
    },
  }),
  columnHelper.accessor('updated_at', {
    header: 'Updated',
    cell: (info) => {
      const date = new Date(info.getValue())
      return date.toLocaleDateString()
    },
  }),
]

export function BoardsTable({
  boards,
  viewMode,
  emptyMessage = 'No boards',
  emptyDescription = 'No boards to display',
}: BoardsTableProps) {
  const table = useReactTable({
    data: boards,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">{emptyMessage}</p>
        <p className="text-xs text-muted-foreground">{emptyDescription}</p>
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-10 px-4 text-left font-medium text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-t cursor-pointer hover:bg-accent/50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="h-12 px-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Grid View - Cards
  return (
    <div className="grid grid-cols-2 gap-3">
      {boards.map((board) => (
        <Card
          key={board.id}
          className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            {board.emoji && <span className="text-xl">{board.emoji}</span>}
            <span className="font-medium truncate">{board.name}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Updated {new Date(board.updated_at).toLocaleDateString()}
          </p>
        </Card>
      ))}
    </div>
  )
}
