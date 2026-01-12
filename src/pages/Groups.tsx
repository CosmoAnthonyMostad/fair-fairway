import { useState } from 'react';
import { Bell, Plus, UserPlus, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGroups } from '@/hooks/useGroups';
import { useFriends } from '@/hooks/useFriends';
import GroupCard from '@/components/groups/GroupCard';
import CreateGroupDialog from '@/components/groups/CreateGroupDialog';
import FriendCard from '@/components/friends/FriendCard';
import FriendRequestCard from '@/components/friends/FriendRequestCard';
import FindFriendsDialog from '@/components/friends/FindFriendsDialog';

const Groups = () => {
  const { groups, loading: groupsLoading, createGroup } = useGroups();
  const { 
    friends, 
    pendingRequests, 
    loading: friendsLoading, 
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest 
  } = useFriends();
  
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [findFriendsOpen, setFindFriendsOpen] = useState(false);

  const loading = groupsLoading || friendsLoading;

  return (
    <>
      {/* Header */}
      <header className="gradient-primary px-4 py-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-primary-foreground">
          Groups & Friends
        </h1>
        <button className="relative p-2 rounded-full hover:bg-primary-foreground/10 transition-colors">
          <Bell className="w-6 h-6 text-primary-foreground" />
          {pendingRequests.length > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent rounded-full" />
          )}
        </button>
      </header>

      {/* Action buttons */}
      <div className="px-4 py-4 flex gap-3">
        <Button 
          className="flex-1 gradient-primary text-primary-foreground gap-2"
          onClick={() => setCreateGroupOpen(true)}
        >
          <Plus className="w-4 h-4" />
          New Group
        </Button>
        <Button 
          variant="outline" 
          className="flex-1 gap-2"
          onClick={() => setFindFriendsOpen(true)}
        >
          <UserPlus className="w-4 h-4" />
          Find Friends
        </Button>
      </div>

      {/* Pending Friend Requests */}
      {pendingRequests.length > 0 && (
        <section className="px-4 py-2">
          <h2 className="font-display text-lg font-semibold text-foreground mb-3">
            Friend Requests ({pendingRequests.length})
          </h2>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <FriendRequestCard
                key={request.id}
                request={request}
                onAccept={acceptFriendRequest}
                onDecline={declineFriendRequest}
              />
            ))}
          </div>
        </section>
      )}

      {/* Golf Groups Section */}
      <section className="px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">
          Golf Groups
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : groups.length > 0 ? (
          <div className="space-y-2">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              No groups yet. Create your first group to start tracking matches!
            </p>
            <Button 
              className="gradient-primary text-primary-foreground gap-2"
              onClick={() => setCreateGroupOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Create Group
            </Button>
          </div>
        )}
      </section>

      {/* Friends Section */}
      <section className="px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">
          Friends ({friends.length})
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : friends.length > 0 ? (
          <div className="space-y-2">
            {friends.map((friend) => (
              <FriendCard key={friend.id} friend={friend} />
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              Find friends by their name to add them to your groups.
            </p>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setFindFriendsOpen(true)}
            >
              <UserPlus className="w-4 h-4" />
              Find Friends
            </Button>
          </div>
        )}
      </section>

      {/* Dialogs */}
      <CreateGroupDialog
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        onCreateGroup={createGroup}
      />
      
      <FindFriendsDialog
        open={findFriendsOpen}
        onOpenChange={setFindFriendsOpen}
        existingFriendIds={friends.map(f => f.user_id)}
        onSendRequest={sendFriendRequest}
      />
    </>
  );
};

export default Groups;
