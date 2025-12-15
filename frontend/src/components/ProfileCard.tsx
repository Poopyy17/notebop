import { useNavigate } from 'react-router-dom'
import { UserPlus, Clock, Check, X, UserMinus, UserCheck } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  useFriendshipStatus,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useCancelFriendRequest,
  useRemoveFriend,
} from '@/hooks/useFriendships'
import type { FriendshipStatus } from '@/api/friendships'

interface ProfileCardProps {
  user: {
    id: string
    name: string
    email: string
    profileImageUrl?: string
  }
  // Optional: pass friendship data directly to avoid extra queries
  friendshipStatus?: FriendshipStatus
  friendshipId?: string
  // Variant for different contexts
  variant?: 'search' | 'friend' | 'incoming' | 'outgoing'
}

export function ProfileCard({
  user,
  friendshipStatus: propStatus,
  friendshipId: propFriendshipId,
  variant = 'search',
}: ProfileCardProps) {
  const navigate = useNavigate()

  // Only fetch if not provided via props
  const { data: statusData } = useFriendshipStatus(
    propStatus === undefined ? user.id : undefined
  )

  const status = propStatus ?? statusData?.status ?? 'none'
  const friendshipId = propFriendshipId ?? statusData?.friendship?.id

  // Mutations
  const sendRequest = useSendFriendRequest()
  const acceptRequest = useAcceptFriendRequest()
  const declineRequest = useDeclineFriendRequest()
  const cancelRequest = useCancelFriendRequest()
  const removeFriend = useRemoveFriend()

  const isLoading =
    sendRequest.isPending ||
    acceptRequest.isPending ||
    declineRequest.isPending ||
    cancelRequest.isPending ||
    removeFriend.isPending

  const handleCardClick = () => {
    navigate(`/user/${user.id}`)
  }

  const handleSendRequest = (e: React.MouseEvent) => {
    e.stopPropagation()
    sendRequest.mutate(user.id)
  }

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (friendshipId) {
      acceptRequest.mutate(friendshipId)
    }
  }

  const handleDecline = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (friendshipId) {
      declineRequest.mutate(friendshipId)
    }
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (friendshipId) {
      cancelRequest.mutate(friendshipId)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (friendshipId) {
      removeFriend.mutate(friendshipId)
    }
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Render action buttons based on status/variant
  const renderActions = () => {
    // For incoming requests variant
    if (variant === 'incoming') {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={isLoading}
          >
            <Check className="size-4" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDecline}
            disabled={isLoading}
          >
            <X className="size-4" />
            Decline
          </Button>
        </div>
      )
    }

    // For outgoing requests variant
    if (variant === 'outgoing') {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
        >
          <X className="size-4" />
          Cancel Request
        </Button>
      )
    }

    // For friends variant
    if (variant === 'friend') {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={handleRemove}
          disabled={isLoading}
        >
          <UserMinus className="size-4" />
          Remove
        </Button>
      )
    }

    // For search variant - show based on status
    switch (status) {
      case 'none':
        return (
          <Button
            size="sm"
            onClick={handleSendRequest}
            disabled={isLoading}
          >
            <UserPlus className="size-4" />
            Add Friend
          </Button>
        )
      case 'request_sent':
        return (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <Clock className="size-4" />
            Request Sent
          </Button>
        )
      case 'request_received':
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={isLoading}
            >
              <Check className="size-4" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDecline}
              disabled={isLoading}
            >
              <X className="size-4" />
            </Button>
          </div>
        )
      case 'friends':
        return (
          <Button
            size="sm"
            variant="secondary"
            disabled
          >
            <UserCheck className="size-4" />
            Friends
          </Button>
        )
      default:
        return null
    }
  }

  // Vertical card layout for search variant (grid)
  if (variant === 'search') {
    return (
      <Card
        className="p-6 cursor-pointer hover:bg-accent/50 transition-colors flex flex-col items-center text-center gap-2 w-58"
        onClick={handleCardClick}
      >
        <Avatar className="size-16">
          <AvatarImage src={user.profileImageUrl} alt={user.name} />
          <AvatarFallback>{getInitials(user.name || 'U')}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 w-full">
          <p className="font-medium text-sm truncate">{user.name || 'Unknown User'}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <div className="w-full">{renderActions()}</div>
      </Card>
    )
  }

  // Horizontal card layout for other variants (list)
  return (
    <Card
      className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={handleCardClick}
    >
      <div className="flex items-center gap-4">
        <Avatar className="size-12">
          <AvatarImage src={user.profileImageUrl} alt={user.name} />
          <AvatarFallback>{getInitials(user.name || 'U')}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{user.name || 'Unknown User'}</p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        </div>
        <div className="flex-shrink-0">{renderActions()}</div>
      </div>
    </Card>
  )
}
