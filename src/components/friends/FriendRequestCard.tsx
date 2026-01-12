import { Check, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FriendRequest } from '@/hooks/useFriends';

interface FriendRequestCardProps {
  request: FriendRequest;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

const FriendRequestCard = ({ request, onAccept, onDecline }: FriendRequestCardProps) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
        {request.requester_avatar ? (
          <img
            src={request.requester_avatar}
            alt={request.requester_name || 'User'}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <User className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">
          {request.requester_name || 'Anonymous'}
        </p>
        <p className="text-xs text-muted-foreground">
          Wants to be friends
        </p>
      </div>
      
      <div className="flex gap-2">
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 text-destructive hover:bg-destructive/10"
          onClick={() => onDecline(request.id)}
        >
          <X className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          className="h-8 w-8 gradient-primary text-primary-foreground"
          onClick={() => onAccept(request.id)}
        >
          <Check className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default FriendRequestCard;
