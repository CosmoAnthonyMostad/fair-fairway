import { Calendar, MapPin, Trophy, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface Match {
  id: string;
  format: string;
  holes_played: number;
  match_date: string;
  status: string;
  course_name?: string;
  course_city?: string;
  course_state?: string;
  winner_names?: string[];
}

interface MatchCardProps {
  match: Match;
  onClick?: () => void;
}

const formatLabel = (format: string): string => {
  const labels: Record<string, string> = {
    stroke_play: 'Stroke Play',
    match_play: 'Match Play',
    '2v2_scramble': 'Scramble',
    best_ball: 'Best Ball',
    shamble: 'Shamble',
  };
  return labels[format] || format;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'in_progress':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'pending':
    default:
      return 'bg-pending/10 text-pending border-pending/20';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'in_progress':
      return 'In Progress';
    case 'pending':
    default:
      return 'Pending';
  }
};

export const MatchCard = ({ match, onClick }: MatchCardProps) => {
  const showStatusBadge = match.status !== 'completed';

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-lg border border-border p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 pr-2">
          <h3 className="font-semibold text-foreground">
            {match.course_name || 'Unknown Course'}
          </h3>
          {(match.course_city || match.course_state) && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {[match.course_city, match.course_state].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
        {showStatusBadge && (
          <Badge variant="outline" className={getStatusColor(match.status)}>
            {getStatusLabel(match.status)}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {format(new Date(match.match_date), 'MMM d, yyyy')}
        </span>
        <span className="flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5" />
          {formatLabel(match.format)}
        </span>
        {match.status === 'completed' && match.winner_names && match.winner_names.length > 0 ? (
          <span className="flex items-center gap-1 text-success">
            <Crown className="w-3.5 h-3.5" />
            {match.winner_names.join(' & ')}
          </span>
        ) : (
          <span className="text-muted-foreground/60">
            {match.status === 'pending' ? 'Awaiting scores' : ''}
          </span>
        )}
      </div>
    </div>
  );
};