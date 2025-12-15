import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { UserPlus, Clock, Check, X, UserMinus, UserCheck, Globe, Lock } from 'lucide-react'
import { useBreadcrumb } from '@/contexts/BreadcrumbContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty'
import { BoardsTable, ViewToggle, type ViewMode } from '@/components/BoardsTable'
import { useGetUser } from '@/hooks/useUsers'
import { useUserBoards } from '@/hooks/useBoards'
import {
  useFriendshipStatus,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useCancelFriendRequest,
  useRemoveFriend,
} from '@/hooks/useFriendships'

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>()
  const { setBreadcrumbs } = useBreadcrumb()

  const { data: user, isLoading, error } = useGetUser(userId)
  const { data: statusData, isLoading: isLoadingStatus } = useFriendshipStatus(userId)
  const { data: boardsData, isLoading: isLoadingBoards } = useUserBoards(userId)

  // View mode state for boards tables
  const [publicViewMode, setPublicViewMode] = useState<ViewMode>('grid')
  const [privateViewMode, setPrivateViewMode] = useState<ViewMode>('grid')

  // Mutations
  const sendRequest = useSendFriendRequest()
  const acceptRequest = useAcceptFriendRequest()
  const declineRequest = useDeclineFriendRequest()
  const cancelRequest = useCancelFriendRequest()
  const removeFriend = useRemoveFriend()

  const isMutating =
    sendRequest.isPending ||
    acceptRequest.isPending ||
    declineRequest.isPending ||
    cancelRequest.isPending ||
    removeFriend.isPending

  const status = statusData?.status ?? 'none'
  const friendshipId = statusData?.friendship?.id

  useEffect(() => {
    if (user) {
      setBreadcrumbs([
        { label: 'Friends', href: '/friends' },
        { label: user.name },
      ])
    }
    return () => setBreadcrumbs([])
  }, [user, setBreadcrumbs])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSendRequest = () => {
    if (userId) {
      sendRequest.mutate(userId)
    }
  }

  const handleAccept = () => {
    if (friendshipId) {
      acceptRequest.mutate(friendshipId)
    }
  }

  const handleDecline = () => {
    if (friendshipId) {
      declineRequest.mutate(friendshipId)
    }
  }

  const handleCancel = () => {
    if (friendshipId) {
      cancelRequest.mutate(friendshipId)
    }
  }

  const handleRemove = () => {
    if (friendshipId) {
      removeFriend.mutate(friendshipId)
    }
  }

  const renderActionButton = () => {
    if (isLoadingStatus) {
      return <Spinner className="size-5" />
    }

    switch (status) {
      case 'none':
        return (
          <Button onClick={handleSendRequest} disabled={isMutating}>
            <UserPlus className="size-4" />
            Add Friend
          </Button>
        )
      case 'request_sent':
        return (
          <Button variant="secondary" onClick={handleCancel} disabled={isMutating}>
            <Clock className="size-4" />
            Cancel Request
          </Button>
        )
      case 'request_received':
        return (
          <div className="flex gap-2">
            <Button onClick={handleAccept} disabled={isMutating}>
              <Check className="size-4" />
              Accept
            </Button>
            <Button variant="outline" onClick={handleDecline} disabled={isMutating}>
              <X className="size-4" />
              Decline
            </Button>
          </div>
        )
      case 'friends':
        return (
          <Button variant="outline" onClick={handleRemove} disabled={isMutating}>
            <UserMinus className="size-4" />
            Remove Friend
          </Button>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <X />
            </EmptyMedia>
            <EmptyTitle>User not found</EmptyTitle>
            <EmptyDescription>
              This user doesn't exist or has been removed
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col p-4 gap-6">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex items-start gap-6">
          <Avatar className="size-24">
            <AvatarImage src={user.profileImageUrl} alt={user.name} />
            <AvatarFallback className="text-2xl">
              {getInitials(user.name || 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{user.name || 'Unknown User'}</h1>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="mt-4 flex items-center gap-2">
              {status === 'friends' && (
                <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                  <UserCheck className="size-4" />
                  Friends
                </span>
              )}
            </div>
          </div>
          <div>{renderActionButton()}</div>
        </div>
      </Card>

      {/* User's Boards - Split Layout */}
      <div className="flex flex-1 gap-6 min-h-0">
        {/* Public Boards (Left) */}
        <Card className="flex-1 p-4 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe className="size-5 text-muted-foreground" />
              <h2 className="font-semibold">Public Boards</h2>
            </div>
            <ViewToggle viewMode={publicViewMode} onViewModeChange={setPublicViewMode} />
          </div>
          {isLoadingBoards ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-6" />
            </div>
          ) : (
            <BoardsTable
              boards={boardsData?.publicBoards ?? []}
              viewMode={publicViewMode}
              emptyMessage="No public boards"
              emptyDescription={`${user.name} hasn't shared any public boards yet`}
            />
          )}
        </Card>

        {/* Private Boards (Right) */}
        <Card className="flex-1 p-4 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="size-5 text-muted-foreground" />
              <h2 className="font-semibold">Private Boards</h2>
            </div>
            {boardsData?.areFriends && (
              <ViewToggle viewMode={privateViewMode} onViewModeChange={setPrivateViewMode} />
            )}
          </div>
          {isLoadingBoards ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-6" />
            </div>
          ) : boardsData?.areFriends ? (
            <BoardsTable
              boards={boardsData?.privateBoards ?? []}
              viewMode={privateViewMode}
              emptyMessage="No private boards"
              emptyDescription={`${user.name} hasn't created any private boards`}
            />
          ) : (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Lock />
                </EmptyMedia>
                <EmptyTitle className="text-base">Private boards hidden</EmptyTitle>
                <EmptyDescription>
                  This user has not configured private boards for public viewing
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </Card>
      </div>
    </div>
  )
}
