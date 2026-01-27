import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, MapPin, Calendar, Trophy } from 'lucide-react';
import { format } from 'date-fns';

interface Player {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface TeamData {
  team_number: number;
  score: number | null;
  handicap_strokes: number;
  is_winner: boolean;
  players: Player[];
}

interface MatchData {
  id: string;
  match_date: string;
  format: string;
  holes_played: number;
  photo_url: string | null;
  course_name: string;
  course_city: string | null;
  course_state: string | null;
  teams: TeamData[];
}

interface MatchQuickViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: string | null;
}

const formatLabel = (matchFormat: string): string => {
  const labels: Record<string, string> = {
    stroke_play: 'Stroke Play',
    match_play: 'Match Play',
    '2v2_scramble': '2v2 Scramble',
    best_ball: 'Best Ball',
    shamble: 'Shamble',
  };
  return labels[matchFormat] || matchFormat;
};

export const MatchQuickViewDialog = ({
  open,
  onOpenChange,
  matchId,
}: MatchQuickViewDialogProps) => {
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMatch = async () => {
      if (!matchId || !open) return;
      
      setLoading(true);
      try {
        // Fetch match with course info
        const { data: match, error: matchError } = await supabase
          .from('matches')
          .select('id, match_date, format, holes_played, photo_url, courses(name, city, state)')
          .eq('id', matchId)
          .maybeSingle();

        if (matchError || !match) throw matchError;

        // Fetch teams
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('id, team_number, score, handicap_strokes, is_winner')
          .eq('match_id', matchId)
          .order('team_number');

        if (teamsError) throw teamsError;

        // Fetch players for each team
        const teamsWithPlayers: TeamData[] = await Promise.all(
          (teams || []).map(async (team) => {
            const { data: teamPlayers } = await supabase
              .from('team_players')
              .select('user_id')
              .eq('team_id', team.id);

            const userIds = teamPlayers?.map(tp => tp.user_id) || [];
            
            let players: Player[] = [];
            if (userIds.length > 0) {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, display_name, avatar_url')
                .in('user_id', userIds);

              players = (profiles || []).map(p => ({
                user_id: p.user_id,
                display_name: p.display_name,
                avatar_url: p.avatar_url,
              }));
            }

            return {
              team_number: team.team_number,
              score: team.score,
              handicap_strokes: team.handicap_strokes || 0,
              is_winner: team.is_winner || false,
              players,
            };
          })
        );

        const course = match.courses as any;
        setMatchData({
          id: match.id,
          match_date: match.match_date,
          format: match.format,
          holes_played: match.holes_played || 18,
          photo_url: match.photo_url,
          course_name: course?.name || 'Unknown Course',
          course_city: course?.city,
          course_state: course?.state,
          teams: teamsWithPlayers,
        });
      } catch (error) {
        console.error('Error fetching match:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [matchId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Match Details</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : matchData ? (
          <div className="space-y-4">
            {/* Match Photo */}
            {matchData.photo_url && (
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={matchData.photo_url} 
                  alt="Match photo" 
                  className="w-full h-32 object-cover"
                />
              </div>
            )}

            {/* Course & Date Info */}
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{matchData.course_name}</p>
              {(matchData.course_city || matchData.course_state) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {[matchData.course_city, matchData.course_state].filter(Boolean).join(', ')}
                </p>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(matchData.match_date), 'MMMM d, yyyy')} • {formatLabel(matchData.format)} • {matchData.holes_played} holes
              </p>
            </div>

            {/* Teams */}
            <div className="space-y-3">
              {matchData.teams.map((team) => (
                <div 
                  key={team.team_number}
                  className={`p-3 rounded-lg border ${
                    team.is_winner 
                      ? 'border-success/30 bg-success/5' 
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Team {team.team_number}
                      </span>
                      {team.is_winner && (
                        <Trophy className="w-3.5 h-3.5 text-success" />
                      )}
                    </div>
                    <div className="text-right">
                      {team.score !== null && (
                        <span className={`font-bold ${team.is_winner ? 'text-success' : 'text-foreground'}`}>
                          {team.score}
                        </span>
                      )}
                      {team.handicap_strokes > 0 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (+{team.handicap_strokes})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {team.players.map((player) => (
                      <div 
                        key={player.user_id}
                        className="flex items-center gap-1.5 bg-secondary/50 rounded-full pl-1 pr-2 py-0.5"
                      >
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={player.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {player.display_name?.charAt(0) || <User className="w-3 h-3" />}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">
                          {player.display_name?.split(' ')[0] || 'Player'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            Match not found
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};