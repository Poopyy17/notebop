import { Globe, Lock, Plus } from "lucide-react"
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"

interface EmptyBoardsProps {
  type: 'public' | 'private'
  onAddNew: () => void
}

export function EmptyBoards({ type, onAddNew }: EmptyBoardsProps) {
  const Icon = type === 'public' ? Globe : Lock
  const label = type === 'public' ? 'public' : 'private'

  return (
    <SidebarMenuItem>
      <div className="flex flex-col items-center gap-3 py-4 px-2 text-center">
        <div className="flex size-8 items-center justify-center rounded-md bg-sidebar-accent">
          <Icon className="h-4 w-4 text-sidebar-accent-foreground" />
        </div>
        <div className="text-xs text-sidebar-foreground/70">No {label} boards yet</div>
        <SidebarMenuButton 
          className="text-sidebar-foreground/70 w-auto"
          onClick={onAddNew}
        >
          <Plus className="h-4 w-4" />
          <span>Add new</span>
        </SidebarMenuButton>
      </div>
    </SidebarMenuItem>
  )
}
