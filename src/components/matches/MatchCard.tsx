import { Calendar, MapPin, Trophy, Crown, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
  onDelete?: (e: React.MouseEvent) => void;
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
    case 'completed':
      return 'bg-success/10 text-success border-success/20';
    case 'in_progress':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'pending':
    default:
      return 'bg-pending/10 text-pending border-pending/20';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In Progress';
    case 'pending':
    default:
      return 'Pending';
  }
};

export const MatchCard = ({ match, onClick, onDelete }: MatchCardProps) => {
  return (
    <div
      onClick={onClick}
      className="bg-card rounded-lg border border-border p-4 hover:bg-secondary/30 transition-colors cursor-pointer relative group"
    >
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
      
      <div className="flex items-start justify-between mb-2 pr-8">
        <div className="flex-1">
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
        <Badge variant="outline" className={getStatusColor(match.status)}>
          {getStatusLabel(match.status)}
        </Badge>
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