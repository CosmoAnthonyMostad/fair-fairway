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
import { Trophy, User, Camera, Pencil, X, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { calculateGsiAdjustment } from '@/lib/handicap';

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

interface MatchInfo {
  id: string;
  format: string;
  holes_played: number;
  match_date: string;
  status: string;
  photo_url: string | null;
  group_id: string;
  course: {
    name: string;
    city: string | null;
    state: string | null;
  } | null;
}

interface MatchDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: string;
  onMatchUpdated: () => void;
}

const formatLabel = (format: string): string => {
  const labels: Record<string, string> = {
    stroke_play: 'Stroke Play',
    match_play: 'Match Play',
    '2v2_scramble': '2v2 Scramble',
    best_ball: 'Best Ball',
    shamble: 'Shamble',
  };
  return labels[format] || format;
};

// Update GSI for players after a match is completed
const updatePlayerGSI = async (
  groupId: string,
  teams: Team[],
  netScores: { teamId: string; score: number; netScore: number }[],
  holesPlayed: number
) => {
  try {
    const allPlayerIds = teams.flatMap(t => t.players.map(p => p.user_id));
    
    const { data: memberData } = await supabase
      .from('group_members')
      .select('id, user_id, gsi')
      .eq('group_id', groupId)
      .in('user_id', allPlayerIds);

    if (!memberData || memberData.length === 0) return;

    const { data: matchHistory } = await supabase
      .from('matches')
      .select('id, teams(team_players(user_id))')
      .eq('group_id', groupId)
      .eq('status', 'completed');

    const playerRounds: Record<string, number> = {};
    allPlayerIds.forEach(id => { playerRounds[id] = 0; });
    
    matchHistory?.forEach((match: any) => {
      match.teams?.forEach((team: any) => {
        team.team_players?.forEach((tp: any) => {
          if (playerRounds[tp.user_id] !== undefined) {
            playerRounds[tp.user_id]++;
          }
        });
      });
    });

    if (teams.length === 2) {
      const team1 = teams.find(t => t.team_number === 1);
      const team2 = teams.find(t => t.team_number === 2);
      const net1 = netScores.find(ns => ns.teamId === team1?.id)?.netScore ?? 0;
      const net2 = netScores.find(ns => ns.teamId === team2?.id)?.netScore ?? 0;
      const margin = net2 - net1;
      
      for (const team of teams) {
        for (const player of team.players) {
          const member = memberData.find(m => m.user_id === player.user_id);
          if (!member) continue;

          const currentGsi = member.gsi ?? 20;
          const rounds = playerRounds[player.user_id] || 0;
          
          let scoreDifferential = 0;
          if (team.team_number === 1) {
            scoreDifferential = -margin;
          } else {
            scoreDifferential = margin;
          }
          
          const newGsi = calculateGsiAdjustment(currentGsi, rounds, scoreDifferential, holesPlayed);
          
          await supabase
            .from('group_members')
            .update({ gsi: newGsi })
            .eq('id', member.id);
        }
      }
    }
  } catch (error) {
    console.error('Error updating GSI:', error);
  }
};

export const MatchDetailDialog = ({
  open,
  onOpenChange,
  matchId,
  onMatchUpdated,
}: MatchDetailDialogProps) => {
  const { toast } = useToast();
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const fetchMatchDetails = async () => {
    try {
      // Fetch match with course info
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*, courses(name, city, state)')
        .eq('id', matchId)
        .maybeSingle();

      if (matchError) throw matchError;
      if (!matchData) return;

      setMatchInfo({
        id: matchData.id,
        format: matchData.format,
        holes_played: matchData.holes_played || 18,
        match_date: matchData.match_date,
        status: matchData.status,
        photo_url: matchData.photo_url,
        group_id: matchData.group_id,
        course: matchData.courses as any,
      });

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
      console.error('Error fetching match details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load match details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !matchInfo) return matchInfo?.photo_url || null;

    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${matchInfo.id}-${Date.now()}.${fileExt}`;
      const filePath = `match-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, photoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return matchInfo?.photo_url || null;
    }
  };

  const handleSaveScores = async () => {
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
      // Upload photo if changed
      const photoUrl = await uploadPhoto();

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

      // Update match with photo and status
      const { error: matchError } = await supabase
        .from('matches')
        .update({ 
          status: 'completed',
          photo_url: photoUrl,
        })
        .eq('id', matchId);

      if (matchError) throw matchError;

      // Update GSI for all players
      if (matchInfo) {
        await updatePlayerGSI(matchInfo.group_id, teams, netScores, matchInfo.holes_played);
      }

      toast({
        title: 'Success',
        description: 'Match updated successfully!',
      });

      onOpenChange(false);
      onMatchUpdated();
    } catch (error: any) {
      console.error('Error saving match:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save match',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (open && matchId) {
      setLoading(true);
      setPhotoFile(null);
      setPhotoPreview(null);
      setIsEditingPhoto(false);
      fetchMatchDetails();
    }
  }, [open, matchId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Match Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !matchInfo ? (
          <p className="text-center text-muted-foreground py-8">
            Match not found.
          </p>
        ) : teams.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No teams set up for this match yet.
          </p>
        ) : (
          <div className="space-y-6">
            {/* Match Info */}
            <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
              <p className="font-semibold text-foreground">{matchInfo.course?.name || 'Unknown Course'}</p>
              {matchInfo.course?.city && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {[matchInfo.course.city, matchInfo.course.state].filter(Boolean).join(', ')}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(matchInfo.match_date), 'MMM d, yyyy')}
                </span>
                <span>{formatLabel(matchInfo.format)}</span>
                <span>{matchInfo.holes_played} holes</span>
              </div>
            </div>

            {/* Photo Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Match Photo
              </Label>
              {(photoPreview || matchInfo.photo_url) && !isEditingPhoto ? (
                <div className="relative">
                  <img 
                    src={photoPreview || matchInfo.photo_url || ''} 
                    alt="Match" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={() => setIsEditingPhoto(true)}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Change
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="match-photo-input"
                  />
                  <label
                    htmlFor="match-photo-input"
                    className="flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload a photo
                    </span>
                  </label>
                  {isEditingPhoto && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full mt-2"
                      onClick={() => setIsEditingPhoto(false)}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Teams & Scores */}
            {teams.map((team) => (
              <div key={team.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold flex items-center gap-2">
                      Team {team.team_number}
                      {team.is_winner && matchInfo.status === 'completed' && (
                        <Trophy className="w-4 h-4 text-accent" />
                      )}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      +{team.handicap_strokes} strokes
                    </p>
                  </div>
                </div>

                {/* Players */}
                <div className="flex flex-wrap gap-2">
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
                      {player.handicap_used !== null && (
                        <span className="text-xs text-muted-foreground">
                          CH: {player.handicap_used.toFixed(1)}
                        </span>
                      )}
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
                onClick={handleSaveScores}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
