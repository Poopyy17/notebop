import { useState, useMemo, useRef, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToParentElement } from '@dnd-kit/modifiers'
import { NoteCard } from './NoteCard'
import { Spinner } from '@/components/ui/spinner'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty'
import { StickyNote } from 'lucide-react'
import { reorderNotesApi } from '@/api/notes'
import { useUser } from '@stackframe/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Note } from '@/api/notes'

interface NoteListProps {
  notes: Note[] | undefined
  isLoading: boolean
  isBoardOwner: boolean
  boardId?: string
}

export function NoteList({ notes, isLoading, isBoardOwner, boardId }: NoteListProps) {
  const user = useUser()
  const queryClient = useQueryClient()
  const [localNotes, setLocalNotes] = useState<Note[]>([])
  
  // Refs for debounced batch updates
  const debounceTimerRef = useRef<number | null>(null)
  const pendingUpdatesRef = useRef<Map<string, number>>(new Map())

  // Sort notes by position and sync with local state
  const sortedNotes = useMemo(() => {
    if (!notes) return []
    const sorted = [...notes].sort((a, b) => a.position - b.position)
    setLocalNotes(sorted)
    return sorted
  }, [notes])

  // DND-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Mutation for reordering notes
  const reorderMutation = useMutation({
    mutationFn: (positions: Array<{ noteId: string; position: number }>) =>
      reorderNotesApi(user?.id || '', boardId || '', positions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', 'board', boardId] })
    },
  })

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Function to send batched updates to API
  const sendBatchUpdate = () => {
    if (pendingUpdatesRef.current.size === 0) return

    // Convert Map to array of positions
    const positions = Array.from(pendingUpdatesRef.current.entries()).map(
      ([noteId, position]) => ({ noteId, position })
    )

    // Send to backend
    reorderMutation.mutate(positions)

    // Clear pending updates
    pendingUpdatesRef.current.clear()
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = localNotes.findIndex((note) => note.id === active.id)
    const newIndex = localNotes.findIndex((note) => note.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // Optimistically update local state
    const reorderedNotes = arrayMove(localNotes, oldIndex, newIndex)
    setLocalNotes(reorderedNotes)

    // Accumulate position changes in the pending updates map
    reorderedNotes.forEach((note: Note, index: number) => {
      pendingUpdatesRef.current.set(note.id, index)
    })

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new debounce timer (500ms delay)
    debounceTimerRef.current = setTimeout(() => {
      sendBatchUpdate()
    }, 500)
  }
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (!sortedNotes || sortedNotes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <StickyNote />
            </EmptyMedia>
            <EmptyTitle>No notes yet</EmptyTitle>
            <EmptyDescription>
              {isBoardOwner
                ? 'Other users can leave notes on your board'
                : 'Be the first to leave a note on this board'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  // If board owner, enable drag and drop
  if (isBoardOwner && boardId) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToParentElement]}
      >
        <SortableContext items={localNotes.map((note) => note.id)} strategy={rectSortingStrategy}>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {localNotes.map((note) => (
              <NoteCard key={note.id} note={note} isBoardOwner={isBoardOwner} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    )
  }

  // For non-owners, just display notes without drag and drop
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {sortedNotes.map((note) => (
        <NoteCard key={note.id} note={note} isBoardOwner={isBoardOwner} />
      ))}
    </div>
  )
}
