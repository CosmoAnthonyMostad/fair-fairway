import { useState } from 'react';
import { User, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Friend } from '@/hooks/useFriends';

interface FriendCardProps {
  friend: Friend;
  onRemove?: (friendshipId: string) => void;
}

const FriendCard = ({ friend, onRemove }: FriendCardProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleRemove = () => {
    onRemove?.(friend.friendship_id);
    setConfirmOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border group">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          {friend.avatar_url ? (
            <img
              src={friend.avatar_url}
              alt={friend.display_name || 'Friend'}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">
            {friend.display_name || 'Anonymous'}
          </p>
        </div>

        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmOpen(true)}
          >
            <UserMinus className="w-4 h-4" />
          </Button>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Friend?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {friend.display_name || 'this friend'}? You'll need to send a new friend request to reconnect.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FriendCard;
