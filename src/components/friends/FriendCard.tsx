import { User } from 'lucide-react';
import type { Friend } from '@/hooks/useFriends';

interface FriendCardProps {
  friend: Friend;
}

const FriendCard = ({ friend }: FriendCardProps) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
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
    </div>
  );
};

export default FriendCard;
