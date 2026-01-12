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
import { Checkbox } from '@/components/ui/checkbox';
import { User, Users, ArrowLeftRight } from 'lucide-react';

interface GroupMember {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  gsi: number | null;
  phi: number | null;
}

interface TeamSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: string;
  groupId: string;
  format: string;
  onTeamsCreated: () => void;
}

export const TeamSetupDialog = ({
  open,
  onOpenChange,
  matchId,
  groupId,
  format,
  onTeamsCreated,
}: TeamSetupDialogProps) => {
  const { toast } = useToast();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [team1Players, setTeam1Players] = useState<string[]>([]);
  const [team2Players, setTeam2Players] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMembers = async () => {
    try {
      // Fetch group members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('id, user_id, gsi')
        .eq('group_id', groupId);

      if (membersError) throw membersError;

      // Fetch profiles
      const userIds = (membersData || []).map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, phi')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const membersList = (membersData || []).map(member => {
        const profile = profiles?.find(p => p.user_id === member.user_id);
        return {
          id: member.id,
          user_id: member.user_id,
          display_name: profile?.display_name || null,
          avatar_url: profile?.avatar_url || null,
          gsi: member.gsi,
          phi: profile?.phi || null,
        };
      });

      setMembers(membersList);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load group members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getHandicap = (member: GroupMember): number => {
    // Use GSI if available, otherwise use PHI, otherwise default to 20
    return member.gsi ?? member.phi ?? 20;
  };

  const calculateTeamHandicap = (playerIds: string[]): number => {
    const players = members.filter(m => playerIds.includes(m.user_id));
    if (players.length === 0) return 0;

    const handicaps = players.map(p => getHandicap(p)).sort((a, b) => a - b);

    // Team handicap calculation based on format
    if (format === 'scramble' && players.length === 2) {
      // 2-person scramble: 35% low + 15% high
      return Math.round((handicaps[0] * 0.35 + handicaps[1] * 0.15) * 10) / 10;
    } else if (format === 'best_ball' && players.length === 2) {
      // Best ball: 80% low + 20% high
      return Math.round((handicaps[0] * 0.8 + handicaps[1] * 0.2) * 10) / 10;
    } else {
      // Default: average
      const sum = handicaps.reduce((a, b) => a + b, 0);
      return Math.round((sum / handicaps.length) * 10) / 10;
    }
  };

  const togglePlayer = (userId: string, team: 1 | 2) => {
    if (team === 1) {
      if (team1Players.includes(userId)) {
        setTeam1Players(team1Players.filter(id => id !== userId));
      } else {
        // Remove from team 2 if present
        setTeam2Players(team2Players.filter(id => id !== userId));
        setTeam1Players([...team1Players, userId]);
      }
    } else {
      if (team2Players.includes(userId)) {
        setTeam2Players(team2Players.filter(id => id !== userId));
      } else {
        // Remove from team 1 if present
        setTeam1Players(team1Players.filter(id => id !== userId));
        setTeam2Players([...team2Players, userId]);
      }
    }
  };

  const handleSubmit = async () => {
    if (team1Players.length === 0 || team2Players.length === 0) {
      toast({
        title: 'Error',
        description: 'Both teams need at least one player',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate relative handicaps (best team gets 0)
      const team1Handicap = calculateTeamHandicap(team1Players);
      const team2Handicap = calculateTeamHandicap(team2Players);
      const minHandicap = Math.min(team1Handicap, team2Handicap);
      
      const team1Strokes = Math.round(team1Handicap - minHandicap);
      const team2Strokes = Math.round(team2Handicap - minHandicap);

      // Create Team 1
      const { data: team1, error: team1Error } = await supabase
        .from('teams')
        .insert({
          match_id: matchId,
          team_number: 1,
          handicap_strokes: team1Strokes,
        })
        .select()
        .single();

      if (team1Error) throw team1Error;

      // Create Team 2
      const { data: team2, error: team2Error } = await supabase
        .from('teams')
        .insert({
          match_id: matchId,
          team_number: 2,
          handicap_strokes: team2Strokes,
        })
        .select()
        .single();

      if (team2Error) throw team2Error;

      // Add Team 1 players
      const team1PlayerInserts = team1Players.map(userId => {
        const member = members.find(m => m.user_id === userId);
        return {
          team_id: team1.id,
          user_id: userId,
          handicap_used: getHandicap(member!),
        };
      });

      const { error: players1Error } = await supabase
        .from('team_players')
        .insert(team1PlayerInserts);

      if (players1Error) throw players1Error;

      // Add Team 2 players
      const team2PlayerInserts = team2Players.map(userId => {
        const member = members.find(m => m.user_id === userId);
        return {
          team_id: team2.id,
          user_id: userId,
          handicap_used: getHandicap(member!),
        };
      });

      const { error: players2Error } = await supabase
        .from('team_players')
        .insert(team2PlayerInserts);

      if (players2Error) throw players2Error;

      toast({
        title: 'Success',
        description: 'Teams created! Ready to play.',
      });

      onOpenChange(false);
      onTeamsCreated();
    } catch (error: any) {
      console.error('Error creating teams:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create teams',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (open) {
      setLoading(true);
      setTeam1Players([]);
      setTeam2Players([]);
      fetchMembers();
    }
  }, [open, groupId]);

  const team1Handicap = calculateTeamHandicap(team1Players);
  const team2Handicap = calculateTeamHandicap(team2Players);
  const minHandicap = Math.min(team1Handicap, team2Handicap);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Set Up Teams
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Team Selection */}
            <div className="grid grid-cols-2 gap-4">
              {/* Team 1 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Team 1</Label>
                  <span className="text-sm text-muted-foreground">
                    +{Math.round(team1Handicap - minHandicap)} strokes
                  </span>
                </div>
                <div className="space-y-1 p-2 border border-border rounded-lg min-h-24 bg-primary/5">
                  {team1Players.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Select players below
                    </p>
                  ) : (
                    team1Players.map(userId => {
                      const member = members.find(m => m.user_id === userId);
                      return (
                        <div key={userId} className="flex items-center gap-2 p-2 bg-card rounded">
                          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                            {member?.avatar_url ? (
                              <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <User className="w-3 h-3 text-muted-foreground" />
                            )}
                          </div>
                          <span className="text-sm font-medium truncate">{member?.display_name || 'Player'}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {getHandicap(member!).toFixed(1)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Team 2 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Team 2</Label>
                  <span className="text-sm text-muted-foreground">
                    +{Math.round(team2Handicap - minHandicap)} strokes
                  </span>
                </div>
                <div className="space-y-1 p-2 border border-border rounded-lg min-h-24 bg-accent/5">
                  {team2Players.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Select players below
                    </p>
                  ) : (
                    team2Players.map(userId => {
                      const member = members.find(m => m.user_id === userId);
                      return (
                        <div key={userId} className="flex items-center gap-2 p-2 bg-card rounded">
                          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                            {member?.avatar_url ? (
                              <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <User className="w-3 h-3 text-muted-foreground" />
                            )}
                          </div>
                          <span className="text-sm font-medium truncate">{member?.display_name || 'Player'}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {getHandicap(member!).toFixed(1)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Available Players */}
            <div className="space-y-2">
              <Label>Available Players</Label>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {members.map((member) => {
                  const inTeam1 = team1Players.includes(member.user_id);
                  const inTeam2 = team2Players.includes(member.user_id);
                  const assigned = inTeam1 || inTeam2;

                  return (
                    <div
                      key={member.user_id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        assigned ? 'border-primary/30 bg-secondary/50' : 'border-border hover:bg-secondary/30'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {member.display_name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Handicap: {getHandicap(member).toFixed(1)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={inTeam1 ? 'default' : 'outline'}
                          className={inTeam1 ? 'gradient-primary text-primary-foreground' : ''}
                          onClick={() => togglePlayer(member.user_id, 1)}
                        >
                          Team 1
                        </Button>
                        <Button
                          size="sm"
                          variant={inTeam2 ? 'default' : 'outline'}
                          className={inTeam2 ? 'bg-accent text-accent-foreground' : ''}
                          onClick={() => togglePlayer(member.user_id, 2)}
                        >
                          Team 2
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
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
                disabled={team1Players.length === 0 || team2Players.length === 0 || isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Teams'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};