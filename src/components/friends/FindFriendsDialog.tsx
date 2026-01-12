import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface FindFriendsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingFriendIds: string[];
  onSendRequest: (userId: string) => Promise<boolean>;
}

const FindFriendsDialog = ({ 
  open, 
  onOpenChange, 
  existingFriendIds,
  onSendRequest 
}: FindFriendsDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<string[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      // Search profiles by display_name (case insensitive)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('display_name', `%${searchQuery}%`);

      if (error) throw error;

      // Filter out current user and existing friends
      const filtered = (data || []).filter(p => 
        p.user_id !== user?.id && !existingFriendIds.includes(p.user_id)
      );

      setResults(filtered);

      if (filtered.length === 0) {
        toast({
          title: 'No results',
          description: 'No users found with that name',
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    const success = await onSendRequest(userId);
    if (success) {
      setSentRequests([...sentRequests, userId]);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setResults([]);
    setSentRequests([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            Find Friends
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={searching || !searchQuery.trim()}
              className="gradient-primary text-primary-foreground"
            >
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.display_name || 'User'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {profile.display_name || 'Anonymous'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={sentRequests.includes(profile.user_id) ? 'secondary' : 'outline'}
                    disabled={sentRequests.includes(profile.user_id)}
                    onClick={() => handleSendRequest(profile.user_id)}
                  >
                    {sentRequests.includes(profile.user_id) ? 'Sent' : 'Add'}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {results.length === 0 && searchQuery && !searching && (
            <p className="text-center text-muted-foreground text-sm py-4">
              Search for friends by their display name
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FindFriendsDialog;
