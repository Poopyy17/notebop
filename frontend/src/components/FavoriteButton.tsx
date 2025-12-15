import { Star } from 'lucide-react'
import { useToggleFavorite } from '@/hooks/useBoards'
import { toast } from '@/lib/toast'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  boardId: string
  isFavorite: boolean
  /** 'sidebar' shows on hover, 'header' always visible */
  variant?: 'sidebar' | 'header'
  className?: string
}

export function FavoriteButton({ 
  boardId, 
  isFavorite, 
  variant = 'sidebar',
  className 
}: FavoriteButtonProps) {
  const toggleFavorite = useToggleFavorite()

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await toggleFavorite.mutateAsync(boardId)
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update favorite')
    }
  }

  if (variant === 'header') {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className={cn("h-7 w-7", className)}
        onClick={handleToggleFavorite}
        disabled={toggleFavorite.isPending}
      >
        <Star 
          className={cn(
            "h-4 w-4",
            isFavorite ? 'text-yellow-500 fill-yellow-500' : ''
          )} 
        />
      </Button>
    )
  }

  // Sidebar variant - shows on hover for non-favorites
  return (
    <Star 
      className={cn(
        "h-3 w-3 shrink-0 cursor-pointer hover:scale-110 transition-all",
        isFavorite 
          ? 'text-yellow-500 fill-yellow-500' 
          : 'text-transparent group-hover/menu-item:text-muted-foreground',
        className
      )}
      onClick={handleToggleFavorite}
    />
  )
}
