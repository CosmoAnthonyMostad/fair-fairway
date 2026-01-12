import { Users, ChevronRight, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { Group } from '@/hooks/useGroups';

interface GroupCardProps {
  group: Group;
  onClick?: () => void;
}

const GroupCard = ({ group, onClick }: GroupCardProps) => {
  const { user } = useAuth();
  const isOwner = group.owner_id === user?.id;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors text-left"
    >
      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
        {group.avatar_url ? (
          <img
            src={group.avatar_url}
            alt={group.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <Users className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground truncate">{group.name}</h3>
          {isOwner && (
            <Crown className="w-4 h-4 text-accent flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
        </p>
      </div>
      
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </button>
  );
};

export default GroupCard;
