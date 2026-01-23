import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, User, Search } from 'lucide-react';
import type { Friend } from '@/hooks/useFriends';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateGroup: (name: string, memberIds?: string[]) => Promise<any>;
  friends: Friend[];
}

// Input validation constants
const MAX_GROUP_NAME_LENGTH = 50;

const CreateGroupDialog = ({ open, onOpenChange, onCreateGroup, friends }: CreateGroupDialogProps) => {
  const [name, setName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const filteredFriends = friends.filter(friend => 
    friend.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    searchQuery === ''
  );

  const validateGroupName = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return 'Group name is required';
    if (trimmed.length > MAX_GROUP_NAME_LENGTH) {
      return `Group name must be ${MAX_GROUP_NAME_LENGTH} characters or less`;
    }
    if (/[<>]/.test(trimmed)) {
      return 'Group name contains invalid characters';
    }
    return null;
  };

  const handleNameChange = (value: string) => {
    const limited = value.slice(0, MAX_GROUP_NAME_LENGTH);
    setName(limited);
    setValidationError(validateGroupName(limited));
  };

  const handleToggleFriend = (userId: string) => {
    setSelectedFriends(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateGroupName(name);
    if (error) {
      setValidationError(error);
      return;
    }

    setLoading(true);
    const result = await onCreateGroup(name.trim(), selectedFriends);
    setLoading(false);

    if (result) {
      setName('');
      setSelectedFriends([]);
      setSearchQuery('');
      setValidationError(null);
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setName('');
    setSelectedFriends([]);
    setSearchQuery('');
    setValidationError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            Create New Group
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="e.g., Weekend Warriors"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              maxLength={MAX_GROUP_NAME_LENGTH}
              autoFocus
            />
            {validationError && (
              <p className="text-xs text-destructive">{validationError}</p>
            )}
          </div>

          {/* Friends Selection */}
          <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
            <Label>Add Friends to Group</Label>
            
            {friends.length > 0 ? (
              <>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search friends..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Friend List */}
                <div className="flex-1 overflow-y-auto space-y-1 max-h-40 border rounded-lg p-2">
                  {filteredFriends.length > 0 ? (
                    filteredFriends.map((friend) => (
                      <label
                        key={friend.user_id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={selectedFriends.includes(friend.user_id)}
                          onCheckedChange={() => handleToggleFriend(friend.user_id)}
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
                        <span className="text-sm font-medium text-foreground truncate">
                          {friend.display_name || 'Anonymous'}
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No friends match your search
                    </p>
                  )}
                </div>

                {selectedFriends.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedFriends.length} friend{selectedFriends.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </>
            ) : (
              <div className="border rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  No friends yet. You can add friends later!
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 gradient-primary text-primary-foreground"
              disabled={!name.trim() || loading}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;
