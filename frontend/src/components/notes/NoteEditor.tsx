import { useState, useRef, useEffect } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { Circle } from '@uiw/react-color'
import { NOTE_COLORS } from '@/lib/note-colors'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useCreateNote } from '@/hooks/useNotes'
import { useUser } from '@stackframe/react'

interface NoteEditorProps {
  boardId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function NoteEditor({ boardId, onSuccess, onCancel }: NoteEditorProps) {
  const user = useUser()
  const [selectedColor, setSelectedColor] = useState<string>(NOTE_COLORS[0])
  const [editorContent, setEditorContent] = useState<string>('')
  const editorRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  const createNote = useCreateNote()

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic'],
          [{ list: 'bullet' }],
        ],
      },
      placeholder: 'Write your note here...',
    })

    quill.on('text-change', () => {
      setEditorContent(quill.root.innerHTML)
    })

    quillRef.current = quill

    return () => {
      if (quillRef.current) {
        quillRef.current = null
      }
    }
  }, [])

  const handleSubmit = async () => {
    if (!user?.id) {
      return
    }

    const trimmedContent = editorContent.trim()
    if (!trimmedContent || trimmedContent === '<p><br></p>') {
      return
    }

    createNote.mutate(
      {
        boardId,
        userId: user.id,
        body: editorContent,
        color: selectedColor,
      },
      {
        onSuccess: () => {
          if (quillRef.current) {
            quillRef.current.setText('')
          }
          setEditorContent('')
          setSelectedColor(NOTE_COLORS[0])
          onSuccess?.()
        },
      }
    )
  }

  const handleCancel = () => {
    if (quillRef.current) {
      quillRef.current.setText('')
    }
    setEditorContent('')
    setSelectedColor(NOTE_COLORS[0])
    onCancel?.()
  }

  const isContentEmpty = !editorContent.trim() || editorContent.trim() === '<p><br></p>'

  return (
    <Card className="p-4 space-y-4" style={{ backgroundColor: selectedColor }}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Note Color</label>
        <Circle
          colors={NOTE_COLORS as unknown as string[]}
          color={selectedColor}
          onChange={(color) => setSelectedColor(color.hex)}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Content</label>
        <div
          ref={editorRef}
          className="bg-white rounded-md min-h-[150px] border"
          style={{ color: '#000' }}
        />
      </div>

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button variant="outline" onClick={handleCancel} disabled={createNote.isPending}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isContentEmpty || createNote.isPending}
        >
          {createNote.isPending ? (
            <>
              <Spinner className="size-4 mr-2" />
              Creating...
            </>
          ) : (
            'Create Note'
          )}
        </Button>
      </div>
    </Card>
  )
}
