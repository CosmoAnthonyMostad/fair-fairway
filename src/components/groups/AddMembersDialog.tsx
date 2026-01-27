import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useFriends } from '@/hooks/useFriends';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Search } from 'lucide-react';

interface AddMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  existingMemberIds: string[];
  onMembersAdded: () => void;
}

export const AddMembersDialog = ({
  open,
  onOpenChange,
  groupId,
  existingMemberIds,
  onMembersAdded,
}: AddMembersDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { friends, loading: friendsLoading } = useFriends();
  
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter friends who are not already members
  const availableFriends = friends.filter(
    friend => !existingMemberIds.includes(friend.user_id)
  );

  const filteredFriends = availableFriends.filter(friend =>
    friend.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSubmit = async () => {
    if (selectedFriends.length === 0 || !user) return;

    setIsSubmitting(true);
    try {
      // Get PHI values for all selected friends to initialize GSI
      const { data: friendProfiles } = await supabase
        .from('profiles')
        .select('user_id, phi')
        .in('user_id', selectedFriends);

      // Add selected friends as members with GSI from their PHI
      const memberInserts = selectedFriends.map(userId => {
        const profile = friendProfiles?.find(p => p.user_id === userId);
        const phi = profile?.phi;
        if (phi === null || phi === undefined) {
          console.warn(`User ${userId} has no PHI set, using default 20`);
        }
        return {
          group_id: groupId,
          user_id: userId,
          gsi: phi ?? 20,
        };
      });

      const { error: membersError } = await supabase
        .from('group_members')
        .insert(memberInserts);

      if (membersError) throw membersError;

      // Send notifications
      const { data: groupData } = await supabase
        .from('groups')
        .select('name')
        .eq('id', groupId)
        .maybeSingle();

      const notificationInserts = selectedFriends.map(userId => ({
        user_id: userId,
        type: 'group_invite',
        title: 'Added to Group',
        message: `You were added to the group "${groupData?.name || 'Unknown'}"`,
        related_id: groupId,
      }));

      await supabase.from('notifications').insert(notificationInserts);

      toast({
        title: 'Success',
        description: `Added ${selectedFriends.length} member${selectedFriends.length > 1 ? 's' : ''} to the group`,
      });

      setSelectedFriends([]);
      setSearchQuery('');
      onOpenChange(false);
      onMembersAdded();
    } catch (error: any) {
      console.error('Error adding members:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to add members',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setSelectedFriends([]);
      setSearchQuery('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Members</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Friends List */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {friendsLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading friends...
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                {availableFriends.length === 0
                  ? 'All your friends are already in this group'
                  : 'No friends found'}
              </div>
            ) : (
              filteredFriends.map((friend) => (
                <div
                  key={friend.user_id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer transition-colors"
                  onClick={() => toggleFriend(friend.user_id)}
                >
                  <Checkbox
                    checked={selectedFriends.includes(friend.user_id)}
                    onCheckedChange={() => toggleFriend(friend.user_id)}
                  />
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    {friend.avatar_url ? (
                      <img
                        src={friend.avatar_url}
                        alt={friend.display_name || 'Friend'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <span className="font-medium text-foreground truncate">
                    {friend.display_name || 'Anonymous'}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gradient-primary text-primary-foreground"
              onClick={handleSubmit}
              disabled={selectedFriends.length === 0 || isSubmitting}
            >
              {isSubmitting ? 'Adding...' : `Add ${selectedFriends.length || ''} Member${selectedFriends.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
