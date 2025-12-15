import { useState, useMemo } from "react"
import { Plus } from "lucide-react"
import { Link as RouterLink, useLocation } from "react-router-dom"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { BoardDialog } from "@/components/BoardDialog"
import { BoardActionsMenu } from "@/components/BoardActionsMenu"
import { FavoriteButton } from "@/components/FavoriteButton"
import { EmptyBoards } from "@/components/sidebar-10/EmptyBoards"
import { usePrivateBoards } from "@/hooks/useBoards"

export function PrivateBoards() {
  const { isMobile } = useSidebar()
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: boards = [], isLoading } = usePrivateBoards()
  const location = useLocation()

  // Sort boards with favorites at the top
  const sortedBoards = useMemo(() => {
    return [...boards].sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1
      if (!a.is_favorite && b.is_favorite) return 1
      return 0
    })
  }, [boards])

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Private Boards</SidebarGroupLabel>
      <SidebarMenu>
        {isLoading && (
          <SidebarMenuItem>
            <div className="flex items-center justify-center py-2">
              <Spinner className="w-4 h-4" />
            </div>
          </SidebarMenuItem>
        )}
        {!isLoading && sortedBoards.length === 0 && (
          <EmptyBoards type="private" onAddNew={() => setDialogOpen(true)} />
        )}
        {!isLoading && sortedBoards.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton asChild isActive={location.pathname === `/board/${item.id}`}>
              <RouterLink to={`/board/${item.id}`} title={item.name}>
                <FavoriteButton 
                  boardId={item.id} 
                  isFavorite={item.is_favorite} 
                  variant="sidebar" 
                />
                {item.emoji && <span>{item.emoji}</span>}
                <span>{item.name}</span>
              </RouterLink>
            </SidebarMenuButton>
            <BoardActionsMenu 
              board={item} 
              variant="sidebar" 
              isMobile={isMobile} 
            />
          </SidebarMenuItem>
        ))}
        {!isLoading && sortedBoards.length > 0 && (
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="text-sidebar-foreground/70"
              onClick={() => setDialogOpen(true)}
            >
              <Plus />
              <span>Add new</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
      <BoardDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        isPrivate={true} 
      />
    </SidebarGroup>
  )
}
