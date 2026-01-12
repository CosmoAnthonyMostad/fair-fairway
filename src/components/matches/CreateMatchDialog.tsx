import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MapPin, Users } from 'lucide-react';
import {
  calculateCourseHandicap,
  calculatePartialHandicap,
  calculateScrambleHandicap,
  calculateBestBallHandicap,
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
  
  // Player selection state
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

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
      // Fetch members with GSI
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

      // Fetch profiles separately
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

  const togglePlayer = (userId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Helper to get a player's course handicap
  const getPlayerCourseHandicap = (userId: string, course: Course, holes: number): number => {
    const member = groupMembers.find(m => m.user_id === userId);
    const gsi = member?.gsi ?? member?.profile?.phi ?? 20;
    
    const fullCH = calculateCourseHandicap(
      gsi,
      course.slope_rating,
      course.course_rating,
      course.par
    );
    return calculatePartialHandicap(fullCH, holes);
  };

  // Helper to calculate team course handicap based on format
  const getTeamCourseHandicap = (playerIds: string[], course: Course, holes: number, matchFormat: string): number => {
    const courseHandicaps = playerIds.map(id => getPlayerCourseHandicap(id, course, holes));
    
    if ((matchFormat === '2v2_scramble' || matchFormat === 'shamble') && courseHandicaps.length >= 2) {
      return calculateScrambleHandicap(courseHandicaps);
    } else if (matchFormat === 'best_ball' && courseHandicaps.length >= 2) {
      return calculateBestBallHandicap(courseHandicaps);
    } else {
      // Individual: average
      const sum = courseHandicaps.reduce((a, b) => a + b, 0);
      return Math.round((sum / courseHandicaps.length) * 10) / 10;
    }
  };

  const handleSubmit = async () => {
    if (!selectedCourse || !user) return;

    if (selectedPlayers.length < 2) {
      toast({
        title: 'Error',
        description: 'Please select at least 2 players for the match',
        variant: 'destructive',
      });
      return;
    }

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

      // Create teams for the match based on format
      const isTeamFormat = format === '2v2_scramble' || format === 'best_ball' || format === 'shamble';
      
      if (isTeamFormat && selectedPlayers.length >= 4) {
        // Split players into teams (first half team 1, second half team 2)
        const halfPoint = Math.ceil(selectedPlayers.length / 2);
        const team1PlayerIds = selectedPlayers.slice(0, halfPoint);
        const team2PlayerIds = selectedPlayers.slice(halfPoint);

        // Calculate team handicaps
        const team1CH = getTeamCourseHandicap(team1PlayerIds, selectedCourse, holes, format);
        const team2CH = getTeamCourseHandicap(team2PlayerIds, selectedCourse, holes, format);
        const [team1Strokes, team2Strokes] = calculateMatchStrokes([team1CH, team2CH]);

        // Create 2 teams with handicap strokes
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .insert([
            { match_id: match.id, team_number: 1, handicap_strokes: team1Strokes },
            { match_id: match.id, team_number: 2, handicap_strokes: team2Strokes },
          ])
          .select();

        if (teamsError) throw teamsError;

        const playerInserts = [
          ...team1PlayerIds.map(userId => ({
            team_id: teams![0].id,
            user_id: userId,
            handicap_used: getPlayerCourseHandicap(userId, selectedCourse, holes),
          })),
          ...team2PlayerIds.map(userId => ({
            team_id: teams![1].id,
            user_id: userId,
            handicap_used: getPlayerCourseHandicap(userId, selectedCourse, holes),
          })),
        ];

        const { error: playersError } = await supabase
          .from('team_players')
          .insert(playerInserts);

        if (playersError) throw playersError;
      } else {
        // Individual format or not enough for teams - each player gets their own team
        // Calculate course handicaps for all players
        const playerCHs = selectedPlayers.map(id => getPlayerCourseHandicap(id, selectedCourse, holes));
        const matchStrokes = calculateMatchStrokes(playerCHs);

        const teamInserts = selectedPlayers.map((_, index) => ({
          match_id: match.id,
          team_number: index + 1,
          handicap_strokes: matchStrokes[index],
        }));

        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .insert(teamInserts)
          .select();

        if (teamsError) throw teamsError;

        const playerInserts = selectedPlayers.map((userId, index) => ({
          team_id: teams![index].id,
          user_id: userId,
          handicap_used: playerCHs[index],
        }));

        const { error: playersError } = await supabase
          .from('team_players')
          .insert(playerInserts);

        if (playersError) throw playersError;
      }

      toast({
        title: 'Success',
        description: 'Match created with players assigned!',
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

  useEffect(() => {
    if (open) {
      fetchCourses();
      fetchGroupMembers();
      // Auto-select current user
      if (user) {
        setSelectedPlayers([user.id]);
      }
    }
  }, [open, user]);

  useEffect(() => {
    if (!open) {
      setSelectedCourse(null);
      setCourseSearch('');
      setFormat('stroke_play');
      setHolesPlayed('18');
      setMatchDate(new Date().toISOString().split('T')[0]);
      setSelectedPlayers([]);
    }
  }, [open]);

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

          {/* Player Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Players ({selectedPlayers.length} selected)
            </Label>
            <div className="max-h-40 overflow-y-auto space-y-2 border border-border rounded-lg p-2">
              {membersLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading members...
                </div>
              ) : groupMembers.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No members found
                </div>
              ) : (
                groupMembers.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 p-2 hover:bg-secondary rounded-lg cursor-pointer transition-colors"
                    onClick={() => togglePlayer(member.user_id)}
                  >
                    <Checkbox
                      checked={selectedPlayers.includes(member.user_id)}
                      onCheckedChange={() => togglePlayer(member.user_id)}
                    />
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {member.profile?.display_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {member.profile?.display_name || 'Unknown'}
                        {member.user_id === user?.id && ' (You)'}
                      </p>
                      {member.profile?.phi && (
                        <p className="text-xs text-muted-foreground">
                          PHI: {member.profile.phi}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={setFormat}>
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
              disabled={!selectedCourse || selectedPlayers.length < 2 || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Match'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
