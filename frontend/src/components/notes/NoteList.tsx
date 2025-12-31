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
import type { Note } from '@/api/notes'

interface NoteListProps {
  notes: Note[] | undefined
  isLoading: boolean
  isBoardOwner: boolean
}

export function NoteList({ notes, isLoading, isBoardOwner }: NoteListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (!notes || notes.length === 0) {
    return (
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
    )
  }

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} isBoardOwner={isBoardOwner} />
      ))}
    </div>
  )
}
