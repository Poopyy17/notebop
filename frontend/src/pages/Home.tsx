import { useEffect } from 'react'
import { useBreadcrumb } from '@/contexts/BreadcrumbContext'
import { Card } from '@/components/ui/card'
import { Lock, Unlock, Settings, Smile } from 'lucide-react'
import NoteBopLogo from '@/assets/NoteBop-logo.png'
import NoteBopLogoW from '@/assets/NoteBop-logoW.png'

export default function Dashboard() {
  const { setBreadcrumbs } = useBreadcrumb()

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard' }
    ])
  }, [setBreadcrumbs])

  return (
    <div className="flex flex-1 flex-col p-4 h-full overflow-y-auto overflow-x-hidden">
      <div className="max-w-5xl mx-auto w-full space-y-8 pb-8">
        {/* Header */}
        <div className="text-center space-y-4 pt-8">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-4xl font-bold">Welcome to</h1>
            <img 
              src={NoteBopLogo} 
              alt="NoteBop" 
              className="h-16 w-auto mb-3 dark:hidden"
              draggable="false"
            />
            <img 
              src={NoteBopLogoW} 
              alt="NoteBop" 
              className="h-16 w-auto mb-3 hidden dark:block"
              draggable="false"
            />
          </div>
          <p className="text-lg text-muted-foreground">
            A simple and fun way to collect anonymous feedback and notes from your friends!
          </p>
        </div>

        {/* Getting Started */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-2">🚀 Getting Started</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Notebop allows you to create boards where others can leave you anonymous or public notes. 
              Perfect for feedback, compliments, questions, or just fun messages!
            </p>
          </div>
        </Card>

        {/* How to Use - Boards */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-semibold">✍️ Creating & Managing Boards</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full size-6 flex items-center justify-center text-sm">1</span>
                Create a Board
              </h3>
              <p className="text-muted-foreground ml-8">
                Click the <strong>"New Board"</strong> button in the sidebar to create your first board. 
                Give it a name and choose an emoji to make it unique!
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full size-6 flex items-center justify-center text-sm">2</span>
                Choose Privacy
              </h3>
              <div className="ml-8 space-y-2">
                <div className="flex items-start gap-2">
                  <Unlock className="size-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Public Boards</p>
                    <p className="text-sm text-muted-foreground">Anyone can view and post notes</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Lock className="size-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Private Boards</p>
                    <p className="text-sm text-muted-foreground">Only your friends can view and post notes</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full size-6 flex items-center justify-center text-sm">3</span>
                Share Your Board
              </h3>
              <p className="text-muted-foreground ml-8">
                Click the <strong>Share</strong> button on your board to copy the link and share it with others!
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings className="size-5" />
                Board Settings
              </h3>
              <p className="text-muted-foreground ml-8">
                Use the <strong>Settings</strong> button to control posting permissions and set note limits.
              </p>
            </div>
          </div>
        </Card>

        {/* How to Use - Notes */}
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold">☝️ Posting & Viewing Notes</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">📝 Posting Notes (Visitors)</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Visit someone's board and click <strong>"Add Note"</strong></li>
                <li>Write your message using the rich text editor</li>
                <li>Choose a color for your note</li>
                <li>Decide if you want to post anonymously or with your name</li>
                <li>Board owners <strong>cannot</strong> post notes on their own boards</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">👀 Viewing Notes (Board Owners)</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Click on any note to view its full content in a modal</li>
                <li>Unviewed notes show a blue dot indicator</li>
                <li>The sidebar shows unviewed note counts for each board</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Smile className="size-5" />
                React to Notes
              </h3>
              <p className="text-muted-foreground ml-4">
                As a board owner, you can add emoji reactions to notes to show appreciation or respond without words!
              </p>
            </div>
          </div>
        </Card>

        {/* Drag & Drop Feature */}
        <Card className="p-6 border-primary/50">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold">✨ Organize Your Notes</h2>
          </div>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Board owners can drag and drop notes to rearrange them in any order!
            </p>
            <div className="space-y-2">
              <h3 className="font-semibold">How to Rearrange:</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Hover over the <strong>top section</strong> of a note (avatar and name area)</li>
                <li>Click and drag to move the note to a new position</li>
                <li>The note will appear above other notes while dragging</li>
                <li>Release to drop it in the new position</li>
                <li>Your arrangement is automatically saved!</li>
              </ul>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>💡 Tip:</strong> The body of the note remains clickable to view details, 
                while the top section is your drag handle. Multiple quick rearrangements are batched 
                into one save for better performance!
              </p>
            </div>
          </div>
        </Card>

        {/* Tips & Tricks */}
        <Card className="p-6 bg-primary/5">
          <h2 className="text-2xl font-semibold">💡 Tips & Tricks</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Use the sidebar to quickly navigate between your boards</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Add friends to share private boards with specific people</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Move boards to trash if you want to archive them temporarily</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Check the unviewed count badges in the sidebar to see new notes at a glance</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Organize your notes by importance or topic using drag and drop</span>
            </li>
          </ul>
        </Card>

        {/* Call to Action */}
        <div className="text-center space-y-4 pt-4">
          <h2 className="text-2xl font-semibold">Ready to get started?</h2>
          <p className="text-muted-foreground">
            Create your first board from the sidebar and start collecting notes! 🎉
          </p>
        </div>
      </div>
    </div>
  )
}
