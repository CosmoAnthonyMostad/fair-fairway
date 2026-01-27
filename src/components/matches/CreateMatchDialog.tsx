import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MapPin, Users, Trophy, Pencil } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  calculateCourseHandicap,
  calculatePartialHandicap,
  calculateScrambleHandicap,
  calculateBestBallHandicap,
  calculateMatchPlayHandicap,
  calculateMatchStrokes,
} from '@/lib/handicap';

interface Course {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  par: number;
  course_rating: number;
  slope_rating: number;
}

interface GroupMember {
  user_id: string;
  gsi: number | null;
  profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    phi: number | null;
  } | null;
}

interface TeamSlot {
  teamNumber: number;
  players: (string | null)[]; // Array of player user_ids, null = empty slot
}

interface HandicapOverride {
  teamNumber: number;
  strokes: number;
}

interface CreateMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  onMatchCreated: () => void;
}

// Match these to the database constraint: '2v2_scramble', 'stroke_play', 'match_play', 'best_ball', 'shamble'
const MATCH_FORMATS = [
  { value: 'stroke_play', label: 'Stroke Play' },
  { value: 'match_play', label: 'Match Play' },
  { value: '2v2_scramble', label: '2v2 Scramble' },
  { value: 'best_ball', label: 'Best Ball' },
  { value: 'shamble', label: 'Shamble' },
];

const HOLES_OPTIONS = [
  { value: '9', label: '9 Holes' },
  { value: '18', label: '18 Holes' },
];

const STROKE_PLAY_PLAYER_OPTIONS = [
  { value: '1', label: '1 Player' },
  { value: '2', label: '2 Players' },
  { value: '3', label: '3 Players' },
  { value: '4', label: '4 Players' },
];

export const CreateMatchDialog = ({
  open,
  onOpenChange,
  groupId,
  onMatchCreated,
}: CreateMatchDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [format, setFormat] = useState('stroke_play');
  const [holesPlayed, setHolesPlayed] = useState('18');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Group members
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  
  // Team-based selection
  const [numPlayers, setNumPlayers] = useState('2'); // For stroke play
  const [teams, setTeams] = useState<TeamSlot[]>([]);
  
  // Handicap override
  const [useHandicapOverride, setUseHandicapOverride] = useState(false);
  const [handicapOverrides, setHandicapOverrides] = useState<HandicapOverride[]>([]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchGroupMembers = async () => {
    try {
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('user_id, gsi')
        .eq('group_id', groupId);

      if (membersError) throw membersError;

      const userIds = (membersData || []).map(m => m.user_id);
      
      if (userIds.length === 0) {
        setGroupMembers([]);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, avatar_url, phi')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      const combined = (membersData || []).map(m => ({
        user_id: m.user_id,
        gsi: m.gsi,
        profile: profilesData?.find(p => p.user_id === m.user_id) || null,
      }));

      setGroupMembers(combined as GroupMember[]);
    } catch (error) {
      console.error('Error fetching group members:', error);
    } finally {
      setMembersLoading(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
    course.city?.toLowerCase().includes(courseSearch.toLowerCase()) ||
    course.state?.toLowerCase().includes(courseSearch.toLowerCase())
  );

  // Initialize teams based on format
  const initializeTeams = (matchFormat: string, playerCount: number = 2) => {
    if (matchFormat === 'stroke_play') {
      // Each player is their own team with 1 slot
      const newTeams: TeamSlot[] = [];
      for (let i = 0; i < playerCount; i++) {
        newTeams.push({ teamNumber: i + 1, players: [null] });
      }
      setTeams(newTeams);
    } else if (matchFormat === 'match_play' || matchFormat === '2v2_scramble' || matchFormat === 'best_ball' || matchFormat === 'shamble') {
      // 2 teams with 2 slots each
      setTeams([
        { teamNumber: 1, players: [null, null] },
        { teamNumber: 2, players: [null, null] },
      ]);
    }
  };

  // Get all selected player IDs across all teams
  const getAllSelectedPlayerIds = (): string[] => {
    const ids: string[] = [];
    teams.forEach(team => {
      team.players.forEach(p => {
        if (p) ids.push(p);
      });
    });
    return ids;
  };

  // Get available players for a dropdown (excludes already selected)
  const getAvailablePlayers = (currentTeamIndex: number, currentSlotIndex: number): GroupMember[] => {
    const selectedIds = getAllSelectedPlayerIds();
    const currentValue = teams[currentTeamIndex]?.players[currentSlotIndex];
    
    return groupMembers.filter(m => {
      // Include if not selected elsewhere, or if it's the current selection
      return !selectedIds.includes(m.user_id) || m.user_id === currentValue;
    });
  };

  // Update a player slot
  const updatePlayerSlot = (teamIndex: number, slotIndex: number, userId: string | null) => {
    setTeams(prev => {
      const newTeams = [...prev];
      newTeams[teamIndex] = {
        ...newTeams[teamIndex],
        players: newTeams[teamIndex].players.map((p, i) => 
          i === slotIndex ? userId : p
        ),
      };
      return newTeams;
    });
  };

  // Get a player's course handicap
  // Prioritizes GSI if it's been updated (not default 20), otherwise uses PHI
  const getPlayerCourseHandicap = (userId: string): number => {
    if (!selectedCourse) return 0;
    const member = groupMembers.find(m => m.user_id === userId);
    
    // Use GSI if it exists and isn't null, otherwise fall back to PHI
    // If both are null/undefined, default to 20
    const gsi = member?.gsi ?? member?.profile?.phi ?? 20;
    const holes = parseInt(holesPlayed);
    
    const fullCH = calculateCourseHandicap(
      gsi,
      selectedCourse.slope_rating,
      selectedCourse.course_rating,
      selectedCourse.par
    );
    return calculatePartialHandicap(fullCH, holes);
  };

  // Calculate team course handicap based on format
  const getTeamCourseHandicap = (playerIds: string[]): number => {
    const courseHandicaps = playerIds.map(id => getPlayerCourseHandicap(id));
    
    if (format === '2v2_scramble' || format === 'shamble') {
      return calculateScrambleHandicap(courseHandicaps);
    } else if (format === 'best_ball') {
      return calculateBestBallHandicap(courseHandicaps);
    } else if (format === 'match_play') {
      return calculateMatchPlayHandicap(courseHandicaps);
    } else {
      // Stroke play - individual, just use their handicap
      return courseHandicaps.length > 0 ? courseHandicaps[0] : 0;
    }
  };

  // Calculate handicap preview
  const handicapPreview = useMemo(() => {
    if (!selectedCourse) return null;
    
    const teamsWithPlayers = teams
      .map((team, index) => {
        const validPlayers = team.players.filter((p): p is string => p !== null);
        if (validPlayers.length === 0) return null;
        
        const teamCH = getTeamCourseHandicap(validPlayers);
        const playerNames = validPlayers.map(id => {
          const member = groupMembers.find(m => m.user_id === id);
          return member?.profile?.display_name?.split(' ')[0] || 'Unknown';
        });
        
        return {
          teamNumber: team.teamNumber,
          courseHandicap: teamCH,
          playerNames,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);
    
    if (teamsWithPlayers.length === 0) return null;
    
    // Calculate relative strokes
    const handicaps = teamsWithPlayers.map(t => t.courseHandicap);
    const strokes = calculateMatchStrokes(handicaps);
    
    return teamsWithPlayers.map((team, i) => ({
      ...team,
      strokes: strokes[i],
    }));
  }, [teams, selectedCourse, format, holesPlayed, groupMembers]);

  // Check minimum requirements
  const canSubmit = useMemo(() => {
    if (!selectedCourse) return false;
    
    const allPlayers = getAllSelectedPlayerIds();
    
    if (format === 'stroke_play') {
      // At least 1 player for solo rounds
      return allPlayers.length >= 1;
    } else {
      // Team formats need at least 1 player per team (2 total)
      const team1Players = teams[0]?.players.filter(p => p !== null) || [];
      const team2Players = teams[1]?.players.filter(p => p !== null) || [];
      return team1Players.length >= 1 && team2Players.length >= 1;
    }
  }, [selectedCourse, teams, format]);

  const handleSubmit = async () => {
    if (!selectedCourse || !user || !canSubmit) return;

    setIsSubmitting(true);
    const holes = parseInt(holesPlayed);
    
    try {
      // Create the match
      const { data: match, error } = await supabase
        .from('matches')
        .insert({
          group_id: groupId,
          course_id: selectedCourse.id,
          format,
          holes_played: holes,
          match_date: matchDate,
          created_by: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Build teams from state
      const teamsToCreate = teams
        .map(team => ({
          teamNumber: team.teamNumber,
          players: team.players.filter((p): p is string => p !== null),
        }))
        .filter(team => team.players.length > 0);

      // Calculate course handicaps for each team (or use overrides)
      const teamHandicaps = teamsToCreate.map(team => getTeamCourseHandicap(team.players));
      const calculatedStrokes = calculateMatchStrokes(teamHandicaps);

      // Use overrides if enabled, otherwise use calculated
      const finalStrokes = useHandicapOverride
        ? teamsToCreate.map(team => {
            const override = handicapOverrides.find(o => o.teamNumber === team.teamNumber);
            return override?.strokes ?? 0;
          })
        : calculatedStrokes;

      // Insert teams
      const teamInserts = teamsToCreate.map((team, index) => ({
        match_id: match.id,
        team_number: team.teamNumber,
        handicap_strokes: finalStrokes[index],
        handicap_override: useHandicapOverride,
      }));

      const { data: createdTeams, error: teamsError } = await supabase
        .from('teams')
        .insert(teamInserts)
        .select();

      if (teamsError) throw teamsError;

      // Insert players for each team
      const playerInserts: { team_id: string; user_id: string; handicap_used: number }[] = [];
      teamsToCreate.forEach((team, index) => {
        team.players.forEach(userId => {
          playerInserts.push({
            team_id: createdTeams![index].id,
            user_id: userId,
            handicap_used: getPlayerCourseHandicap(userId),
          });
        });
      });

      const { error: playersError } = await supabase
        .from('team_players')
        .insert(playerInserts);

      if (playersError) throw playersError;

      toast({
        title: 'Success',
        description: 'Match created with teams assigned!',
      });

      onOpenChange(false);
      onMatchCreated();
    } catch (error: any) {
      console.error('Error creating match:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create match',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle format change
  const handleFormatChange = (newFormat: string) => {
    setFormat(newFormat);
    if (newFormat === 'stroke_play') {
      initializeTeams(newFormat, parseInt(numPlayers));
    } else {
      initializeTeams(newFormat);
    }
  };

  // Handle number of players change (stroke play only)
  const handleNumPlayersChange = (value: string) => {
    setNumPlayers(value);
    initializeTeams('stroke_play', parseInt(value));
  };

  // Initialize handicap overrides when preview updates
  useEffect(() => {
    if (handicapPreview && handicapPreview.length > 0 && !useHandicapOverride) {
      setHandicapOverrides(
        handicapPreview.map(t => ({ teamNumber: t.teamNumber, strokes: t.strokes }))
      );
    }
  }, [handicapPreview]);

  // Reset override when toggle is turned off
  const handleOverrideToggle = (enabled: boolean) => {
    setUseHandicapOverride(enabled);
    if (!enabled && handicapPreview) {
      setHandicapOverrides(
        handicapPreview.map(t => ({ teamNumber: t.teamNumber, strokes: t.strokes }))
      );
    }
  };

  // Update a single override value
  const updateOverride = (teamNumber: number, strokes: number) => {
    setHandicapOverrides(prev =>
      prev.map(o => (o.teamNumber === teamNumber ? { ...o, strokes } : o))
    );
  };

  useEffect(() => {
    if (open) {
      fetchCourses();
      fetchGroupMembers();
      initializeTeams('stroke_play', 2);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setSelectedCourse(null);
      setCourseSearch('');
      setFormat('stroke_play');
      setHolesPlayed('18');
      setMatchDate(new Date().toISOString().split('T')[0]);
      setNumPlayers('2');
      setTeams([]);
      setUseHandicapOverride(false);
      setHandicapOverrides([]);
    }
  }, [open]);

  const getMemberByUserId = (userId: string) => 
    groupMembers.find(m => m.user_id === userId);

  const isTeamFormat = format === 'match_play' || format === '2v2_scramble' || format === 'best_ball' || format === 'shamble';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Match</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Course Selection */}
          <div className="space-y-2">
            <Label>Course</Label>
            {selectedCourse ? (
              <div className="p-3 bg-secondary rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{selectedCourse.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {[selectedCourse.city, selectedCourse.state].filter(Boolean).join(', ')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Par {selectedCourse.par} • Rating {selectedCourse.course_rating} / Slope {selectedCourse.slope_rating}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCourse(null)}
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-lg">
                  {coursesLoading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Loading courses...
                    </div>
                  ) : filteredCourses.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No courses found
                    </div>
                  ) : (
                    filteredCourses.slice(0, 20).map((course) => (
                      <div
                        key={course.id}
                        className="p-3 hover:bg-secondary cursor-pointer transition-colors"
                        onClick={() => setSelectedCourse(course)}
                      >
                        <p className="font-medium text-foreground">{course.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {[course.city, course.state].filter(Boolean).join(', ')} • Par {course.par}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={handleFormatChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {MATCH_FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Number of Players (Stroke Play only) */}
          {format === 'stroke_play' && (
            <div className="space-y-2">
              <Label>Number of Players</Label>
              <Select value={numPlayers} onValueChange={handleNumPlayersChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select players" />
                </SelectTrigger>
                <SelectContent>
                  {STROKE_PLAY_PLAYER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Team Configuration */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {isTeamFormat ? 'Teams' : 'Players'}
            </Label>
            
            {membersLoading ? (
              <div className="p-4 text-center text-muted-foreground border border-border rounded-lg">
                Loading members...
              </div>
            ) : (
              <div className="space-y-3">
                {teams.map((team, teamIndex) => (
                  <div key={teamIndex} className="border border-border rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      {isTeamFormat ? `Team ${team.teamNumber}` : `Player ${team.teamNumber}`}
                    </p>
                    
                    {team.players.map((playerId, slotIndex) => {
                      const availablePlayers = getAvailablePlayers(teamIndex, slotIndex);
                      const isOptionalSlot = isTeamFormat && slotIndex === 1;
                      
                      return (
                        <Select
                          key={slotIndex}
                          value={playerId || 'empty'}
                          onValueChange={(value) => 
                            updatePlayerSlot(teamIndex, slotIndex, value === 'empty' ? null : value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={isOptionalSlot ? "Select player (optional)" : "Select player..."}>
                              {playerId ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-5 h-5">
                                    <AvatarImage src={getMemberByUserId(playerId)?.profile?.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {getMemberByUserId(playerId)?.profile?.display_name?.charAt(0) || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="truncate">
                                    {getMemberByUserId(playerId)?.profile?.display_name || 'Unknown'}
                                    {playerId === user?.id && ' (You)'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">
                                  {isOptionalSlot ? "Select player (optional)" : "Select player..."}
                                </span>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {isOptionalSlot && (
                              <SelectItem value="empty">
                                <span className="text-muted-foreground">— None —</span>
                              </SelectItem>
                            )}
                            {availablePlayers.map((member) => (
                              <SelectItem key={member.user_id} value={member.user_id}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-5 h-5">
                                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {member.profile?.display_name?.charAt(0) || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>
                                    {member.profile?.display_name || 'Unknown'}
                                    {member.user_id === user?.id && ' (You)'}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Holes */}
          <div className="space-y-2">
            <Label>Holes</Label>
            <Select value={holesPlayed} onValueChange={setHolesPlayed}>
              <SelectTrigger>
                <SelectValue placeholder="Select holes" />
              </SelectTrigger>
              <SelectContent>
                {HOLES_OPTIONS.map((h) => (
                  <SelectItem key={h.value} value={h.value}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Match Date</Label>
            <Input
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
            />
          </div>

          {/* Handicap Preview */}
          {handicapPreview && handicapPreview.length > 0 && (
            <div className="border border-border rounded-lg p-3 bg-secondary/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  <p className="text-sm font-medium text-foreground">Handicap Strokes</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="override-toggle" className="text-xs text-muted-foreground cursor-pointer">
                    <Pencil className="w-3 h-3 inline mr-1" />
                    Override
                  </Label>
                  <Switch
                    id="override-toggle"
                    checked={useHandicapOverride}
                    onCheckedChange={handleOverrideToggle}
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                {handicapPreview.map((team) => {
                  const override = handicapOverrides.find(o => o.teamNumber === team.teamNumber);
                  const displayStrokes = useHandicapOverride ? (override?.strokes ?? 0) : team.strokes;
                  
                  return (
                    <div key={team.teamNumber} className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">
                          {isTeamFormat ? `Team ${team.teamNumber}` : `Player ${team.teamNumber}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {team.playerNames.join(', ')}
                        </p>
                      </div>
                      
                      {useHandicapOverride ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground">+</span>
                          <Input
                            type="number"
                            min="0"
                            max="54"
                            className="w-16 h-8 text-center"
                            value={override?.strokes ?? 0}
                            onChange={(e) => updateOverride(team.teamNumber, parseInt(e.target.value) || 0)}
                          />
                          <span className="text-sm text-muted-foreground">strokes</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-foreground">
                          {displayStrokes === 0 ? '0' : `+${displayStrokes}`} strokes
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {useHandicapOverride && (
                <p className="text-xs text-muted-foreground mt-2 italic">
                  Custom handicaps will be used instead of calculated values
                </p>
              )}
            </div>
          )}

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
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Match'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
