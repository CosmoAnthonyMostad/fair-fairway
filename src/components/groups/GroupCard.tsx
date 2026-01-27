import { ChevronRight, Crown, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { Group } from '@/hooks/useGroups';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface GroupCardProps {
  group: Group;
}

const GroupCard = ({ group }: GroupCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwner = group.owner_id === user?.id;

  const handleClick = () => {
    navigate(`/groups/${group.id}`);
  };

  const memberPreviews = group.member_previews || [];
  const displayCount = Math.min(memberPreviews.length, 4);
  const extraCount = (group.member_count || 0) - displayCount;

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 p-3 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors text-left"
    >
      {/* Avatar Stack */}
      <div className="flex -space-x-2 flex-shrink-0">
        {memberPreviews.slice(0, 4).map((member, index) => (
          <Avatar
            key={member.user_id}
            className="w-9 h-9 border-2 border-card"
            style={{ zIndex: 4 - index }}
          >
            <AvatarImage src={member.avatar_url || undefined} alt={member.display_name || 'Member'} />
            <AvatarFallback className="bg-secondary text-xs">
              {member.display_name?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
            </AvatarFallback>
          </Avatar>
        ))}
        {extraCount > 0 && (
          <div 
            className="w-9 h-9 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-xs font-medium text-muted-foreground"
            style={{ zIndex: 0 }}
          >
            +{extraCount}
          </div>
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