import { useState, useRef, useEffect } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { NOTE_COLORS } from '@/lib/note-colors'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Bold, Italic, List } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { useCreateNote } from '@/hooks/useNotes'
import { useUser } from '@stackframe/react'

interface NoteEditorModalProps {
  boardId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NoteEditorModal({ boardId, open, onOpenChange }: NoteEditorModalProps) {
  const user = useUser()
  const [selectedColor, setSelectedColor] = useState<string>(NOTE_COLORS[0])
  const [editorContent, setEditorContent] = useState<string>('')
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true)
  const editorRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  const createNote = useCreateNote()

  useEffect(() => {
    if (!open) return
    
    // Wait for the DOM to be ready
    const timer = setTimeout(() => {
      if (!editorRef.current || quillRef.current) return

      const quill = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: false, // Disable default toolbar
        },
        placeholder: 'Write your note here...',
      })

      quill.on('text-change', () => {
        setEditorContent(quill.root.innerHTML)
      })

      quillRef.current = quill
    }, 100)

    return () => {
      clearTimeout(timer)
      if (quillRef.current) {
        quillRef.current.off('text-change')
        quillRef.current = null
      }
    }
  }, [open])

  const handleFormat = (format: string) => {
    if (!quillRef.current) return
    
    const currentFormat = quillRef.current.getFormat()
    if (format === 'list') {
      quillRef.current.format('list', currentFormat.list === 'bullet' ? false : 'bullet')
    } else {
      quillRef.current.format(format, !currentFormat[format])
    }
  }

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
        isAnonymous,
      },
      {
        onSuccess: () => {
          if (quillRef.current) {
            quillRef.current.setText('')
          }
          setEditorContent('')
          setSelectedColor(NOTE_COLORS[0])
          setIsAnonymous(true)
          onOpenChange(false)
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
    setIsAnonymous(true)
    onOpenChange(false)
  }

  const isContentEmpty = !editorContent.trim() || editorContent.trim() === '<p><br></p>'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl" style={{ backgroundColor: selectedColor }}>
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-900">Create a Note</DialogTitle>
          <DialogDescription className="text-gray-700 dark:text-gray-700">
            Leave a note on this board. Choose a color and write your message.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-900">Note Color</label>
            <div className="flex gap-2">
              {NOTE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="size-10 rounded-full transition-all hover:scale-110"
                  style={{
                    backgroundColor: color,
                    border: selectedColor === color ? '2px solid rgba(0, 0, 0, 0.4)' : '1px solid rgba(0, 0, 0, 0.1)',
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-900">Content</label>
              <ToggleGroup type="multiple" variant="outline" size="sm" className="[&_button]:border-gray-500">
                <ToggleGroupItem
                  value="bold"
                  aria-label="Toggle bold"
                  onClick={() => handleFormat('bold')}
                  className="text-gray-900"
                >
                  <Bold className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="italic"
                  aria-label="Toggle italic"
                  onClick={() => handleFormat('italic')}
                  className="text-gray-900"
                >
                  <Italic className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="list"
                  aria-label="Toggle bullet list"
                  onClick={() => handleFormat('list')}
                  className="text-gray-900"
                >
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div
              ref={editorRef}
              className="bg-white rounded-md min-h-[250px] cursor-text [&_.ql-toolbar]:hidden"
              style={{ color: '#000' }}
              onClick={() => {
                if (quillRef.current) {
                  quillRef.current.focus()
                }
              }}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 mr-auto">
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
              className="data-[state=checked]:bg-gray-600 data-[state=unchecked]:bg-gray-400 border-gray-500"
            />
            <label
              htmlFor="anonymous"
              className="text-sm font-medium text-gray-900 dark:text-gray-900 cursor-pointer"
            >
              Post anonymously
            </label>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={createNote.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isContentEmpty || createNote.isPending}>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
