import { useState, useEffect } from 'react'
import { Search, Users, UserPlus, Clock } from 'lucide-react'
import { useBreadcrumb } from '@/contexts/BreadcrumbContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ProfileCard } from '@/components/ProfileCard'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import { useSearchUsers, useSuggestedUsers } from '@/hooks/useUsers'
import {
  useFriends,
  useIncomingRequests,
  useOutgoingRequests,
} from '@/hooks/useFriendships'

type Tab = 'search' | 'manage'
type ManageTab = 'requests' | 'sent' | 'friends'

export default function Friends() {
  const { setBreadcrumbs } = useBreadcrumb()
  const [activeTab, setActiveTab] = useState<Tab>('search')
  const [manageTab, setManageTab] = useState<ManageTab>('requests')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')

  // Filter state for friends list
  const [friendsFilter, setFriendsFilter] = useState('')

  // Determine if we're in search mode
  const isSearchMode = submittedQuery.trim().length > 0

  // Queries
  const {
    data: searchResults,
    isLoading: isSearching,
    isFetched: hasSearched,
  } = useSearchUsers(submittedQuery)

  // Suggested users - disabled when searching to save resources
  const {
    data: suggestedUsers,
    isLoading: isLoadingSuggestions,
  } = useSuggestedUsers(!isSearchMode)

  const { data: friends, isLoading: isLoadingFriends } = useFriends()
  const { data: incomingRequests, isLoading: isLoadingIncoming } =
    useIncomingRequests()
  const { data: outgoingRequests, isLoading: isLoadingOutgoing } =
    useOutgoingRequests()

  useEffect(() => {
    setBreadcrumbs([{ label: 'Friends' }])
    return () => setBreadcrumbs([])
  }, [setBreadcrumbs])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittedQuery(searchQuery.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setSubmittedQuery(searchQuery.trim())
    }
  }

  // Filter friends by name
  const filteredFriends = friends?.filter((friend) =>
    friend.name?.toLowerCase().includes(friendsFilter.toLowerCase())
  )

  return (
    <div className="flex flex-1 flex-col p-4 gap-4 h-full">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={activeTab === 'search' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('search')}
          className="gap-2"
        >
          <Search className="size-4" />
          Search
        </Button>
        <Button
          variant={activeTab === 'manage' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('manage')}
          className="gap-2"
        >
          <Users className="size-4" />
          Manage Friends
          {(incomingRequests?.length ?? 0) > 0 && (
            <span className="ml-1 bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
              {incomingRequests?.length}
            </span>
          )}
        </Button>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="flex flex-1 flex-col gap-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={!searchQuery.trim()}>
              <Search className="size-4" />
              Search
            </Button>
          </form>

          {/* Search Results / Suggested Friends Card */}
          <Card className="flex-1 p-4 overflow-auto">
            {isSearchMode ? (
              // Search mode - show only search results (full card)
              isSearching ? (
                <div className="flex items-center justify-center h-64">
                  <Spinner className="size-8" />
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <div className="flex flex-wrap gap-4 content-start">
                  {searchResults.map((user) => (
                    <ProfileCard key={user.id} user={user} variant="search" />
                  ))}
                </div>
              ) : hasSearched ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Users />
                    </EmptyMedia>
                    <EmptyTitle>No users found</EmptyTitle>
                    <EmptyDescription>
                      Try searching with a different name
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : null
            ) : (
              // Default mode - show empty state + suggested friends
              <div className="flex flex-col h-full">
                {/* Top: Empty state */}
                <div className="flex-1 flex items-center justify-center">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Search />
                      </EmptyMedia>
                      <EmptyTitle>Search for users</EmptyTitle>
                      <EmptyDescription>
                        Enter a name to find and add friends
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>

                {/* Divider */}
                <div className="border-t my-4" />

                {/* Bottom: Suggested Friends */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">Suggested Friends</h3>
                  </div>
                  {isLoadingSuggestions ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner className="size-6" />
                    </div>
                  ) : suggestedUsers && suggestedUsers.length > 0 ? (
                    <div className="flex flex-wrap gap-4 content-start">
                      {suggestedUsers.map((user) => (
                        <ProfileCard key={user.id} user={user} variant="search" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No suggestions available
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Manage Friends Tab */}
      {activeTab === 'manage' && (
        <div className="flex flex-1 flex-col gap-4">
          {/* Sub-tabs for Manage Friends */}
          <div className="flex gap-2">
            <Button
              variant={manageTab === 'requests' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setManageTab('requests')}
              className="gap-2"
            >
              <UserPlus className="size-4" />
              Requests
              {(incomingRequests?.length ?? 0) > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {incomingRequests?.length}
                </span>
              )}
            </Button>
            <Button
              variant={manageTab === 'sent' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setManageTab('sent')}
              className="gap-2"
            >
              <Clock className="size-4" />
              Sent
              {(outgoingRequests?.length ?? 0) > 0 && (
                <span className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {outgoingRequests?.length}
                </span>
              )}
            </Button>
            <Button
              variant={manageTab === 'friends' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setManageTab('friends')}
              className="gap-2"
            >
              <Users className="size-4" />
              My Friends
              {(friends?.length ?? 0) > 0 && (
                <span className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {friends?.length}
                </span>
              )}
            </Button>
          </div>

          {/* Friend Requests Tab */}
          {manageTab === 'requests' && (
            <Card className="flex-1 p-4 overflow-auto">
              {isLoadingIncoming ? (
                <div className="flex items-center justify-center h-64">
                  <Spinner className="size-8" />
                </div>
              ) : incomingRequests && incomingRequests.length > 0 ? (
                <div className="grid gap-3">
                  {incomingRequests.map((request) => (
                    <ProfileCard
                      key={request.friendship_id}
                      user={{
                        id: request.id,
                        name: request.name,
                        email: request.email,
                        profileImageUrl: request.profileImageUrl,
                      }}
                      friendshipId={request.friendship_id}
                      friendshipStatus="request_received"
                      variant="incoming"
                    />
                  ))}
                </div>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <UserPlus />
                    </EmptyMedia>
                    <EmptyTitle>No pending requests</EmptyTitle>
                    <EmptyDescription>
                      Friend requests you receive will appear here
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </Card>
          )}

          {/* Sent Requests Tab */}
          {manageTab === 'sent' && (
            <Card className="flex-1 p-4 overflow-auto">
              {isLoadingOutgoing ? (
                <div className="flex items-center justify-center h-64">
                  <Spinner className="size-8" />
                </div>
              ) : outgoingRequests && outgoingRequests.length > 0 ? (
                <div className="grid gap-3">
                  {outgoingRequests.map((request) => (
                    <ProfileCard
                      key={request.friendship_id}
                      user={{
                        id: request.id,
                        name: request.name,
                        email: request.email,
                        profileImageUrl: request.profileImageUrl,
                      }}
                      friendshipId={request.friendship_id}
                      friendshipStatus="request_sent"
                      variant="outgoing"
                    />
                  ))}
                </div>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Clock />
                    </EmptyMedia>
                    <EmptyTitle>No sent requests</EmptyTitle>
                    <EmptyDescription>
                      Friend requests you send will appear here
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </Card>
          )}

          {/* My Friends Tab */}
          {manageTab === 'friends' && (
            <div className="flex flex-1 flex-col gap-4">
              {/* Search input for friends */}
              {(friends?.length ?? 0) > 0 && (
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search friends..."
                    value={friendsFilter}
                    onChange={(e) => setFriendsFilter(e.target.value)}
                    className="pl-9"
                  />
                </div>
              )}
              <Card className="flex-1 p-4 overflow-auto">
                {isLoadingFriends ? (
                  <div className="flex items-center justify-center h-64">
                    <Spinner className="size-8" />
                  </div>
                ) : filteredFriends && filteredFriends.length > 0 ? (
                  <div className="grid gap-3">
                    {filteredFriends.map((friend) => (
                      <ProfileCard
                        key={friend.friendship_id}
                        user={{
                          id: friend.id,
                          name: friend.name,
                          email: friend.email,
                          profileImageUrl: friend.profileImageUrl,
                        }}
                        friendshipId={friend.friendship_id}
                        friendshipStatus="friends"
                        variant="friend"
                      />
                    ))}
                  </div>
                ) : friends && friends.length > 0 && friendsFilter ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Users />
                      </EmptyMedia>
                      <EmptyTitle>No matches found</EmptyTitle>
                      <EmptyDescription>
                        No friends match your filter
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Users />
                      </EmptyMedia>
                      <EmptyTitle>No friends yet</EmptyTitle>
                      <EmptyDescription>
                        Search for users and send friend requests to connect
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
