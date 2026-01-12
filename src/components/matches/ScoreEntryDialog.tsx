import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, User } from 'lucide-react';

interface Team {
  id: string;
  team_number: number;
  handicap_strokes: number;
  score: number | null;
  is_winner: boolean;
  players: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    handicap_used: number | null;
  }[];
}

interface ScoreEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: string;
  onScoresUpdated: () => void;
}

export const ScoreEntryDialog = ({
  open,
  onOpenChange,
  matchId,
  onScoresUpdated,
}: ScoreEntryDialogProps) => {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTeams = async () => {
    try {
      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('match_id', matchId)
        .order('team_number');

      if (teamsError) throw teamsError;

      // Fetch team players
      const teamIds = (teamsData || []).map(t => t.id);
      const { data: playersData, error: playersError } = await supabase
        .from('team_players')
        .select('*')
        .in('team_id', teamIds);

      if (playersError) throw playersError;

      // Fetch profiles
      const userIds = (playersData || []).map(p => p.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine data
      const teamsWithPlayers = (teamsData || []).map(team => {
        const teamPlayers = (playersData || [])
          .filter(p => p.team_id === team.id)
          .map(p => {
            const profile = profiles?.find(pr => pr.user_id === p.user_id);
            return {
              user_id: p.user_id,
              display_name: profile?.display_name || null,
              avatar_url: profile?.avatar_url || null,
              handicap_used: p.handicap_used,
            };
          });

        return {
          ...team,
          players: teamPlayers,
        };
      });

      setTeams(teamsWithPlayers);
      
      // Initialize scores
      const initialScores: Record<string, string> = {};
      teamsWithPlayers.forEach(team => {
        initialScores[team.id] = team.score?.toString() || '';
      });
      setScores(initialScores);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: 'Error',
        description: 'Failed to load teams',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate scores
    const scoreValues: { teamId: string; score: number }[] = [];
    for (const team of teams) {
      const scoreStr = scores[team.id];
      if (!scoreStr) {
        toast({
          title: 'Error',
          description: 'Please enter scores for all teams',
          variant: 'destructive',
        });
        return;
      }
      const score = parseInt(scoreStr);
      if (isNaN(score) || score < 0) {
        toast({
          title: 'Error',
          description: 'Please enter valid scores',
          variant: 'destructive',
        });
        return;
      }
      scoreValues.push({ teamId: team.id, score });
    }

    setIsSubmitting(true);
    try {
      // Determine winner (lowest net score wins)
      const netScores = scoreValues.map(sv => {
        const team = teams.find(t => t.id === sv.teamId);
        return {
          ...sv,
          netScore: sv.score - (team?.handicap_strokes || 0),
        };
      });
      const minNetScore = Math.min(...netScores.map(s => s.netScore));
      
      // Update each team
      for (const ns of netScores) {
        const isWinner = ns.netScore === minNetScore;
        const { error } = await supabase
          .from('teams')
          .update({
            score: ns.score,
            is_winner: isWinner,
          })
          .eq('id', ns.teamId);

        if (error) throw error;
      }

      // Update match status to completed
      const { error: matchError } = await supabase
        .from('matches')
        .update({ status: 'completed' })
        .eq('id', matchId);

      if (matchError) throw matchError;

      toast({
        title: 'Success',
        description: 'Scores saved! Match completed.',
      });

      onOpenChange(false);
      onScoresUpdated();
    } catch (error: any) {
      console.error('Error saving scores:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save scores',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchTeams();
    }
  }, [open, matchId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Enter Scores
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : teams.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No teams set up for this match yet.
          </p>
        ) : (
          <div className="space-y-6">
            {teams.map((team) => (
              <div key={team.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold">
                      Team {team.team_number}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      +{team.handicap_strokes} strokes
                    </p>
                  </div>
                </div>

                {/* Players */}
                <div className="flex gap-2">
                  {team.players.map((player) => (
                    <div
                      key={player.user_id}
                      className="flex items-center gap-2 px-2 py-1 bg-secondary rounded"
                    >
                      <div className="w-5 h-5 rounded-full bg-background flex items-center justify-center">
                        {player.avatar_url ? (
                          <img src={player.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-xs font-medium">
                        {player.display_name || 'Player'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Score Input */}
                <div className="flex items-center gap-3">
                  <Label htmlFor={`score-${team.id}`} className="w-24">
                    Gross Score:
                  </Label>
                  <Input
                    id={`score-${team.id}`}
                    type="number"
                    min="0"
                    value={scores[team.id] || ''}
                    onChange={(e) => setScores({ ...scores, [team.id]: e.target.value })}
                    className="w-24"
                    placeholder="72"
                  />
                  {scores[team.id] && (
                    <span className="text-sm text-muted-foreground">
                      Net: {parseInt(scores[team.id]) - team.handicap_strokes}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 gradient-primary text-primary-foreground"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Scores'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};