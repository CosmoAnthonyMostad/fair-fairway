import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { AddMembersDialog } from '@/components/groups/AddMembersDialog';
import { CreateMatchDialog } from '@/components/matches/CreateMatchDialog';
import { TeamSetupDialog } from '@/components/matches/TeamSetupDialog';
import { MatchDetailDialog } from '@/components/matches/MatchDetailDialog';
import { MatchCard } from '@/components/matches/MatchCard';
import { 
  ArrowLeft, 
  Users, 
  Crown, 
  User, 
  MoreVertical,
  Pencil,
  LogOut,
  Trash2,
  UserPlus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GroupMember {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  gsi: number | null;
  ghi: number | null;
}

interface GroupDetails {
  id: string;
  name: string;
  avatar_url: string | null;
  owner_id: string;
  created_at: string;
}

interface Match {
  id: string;
  format: string;
  holes_played: number;
  match_date: string;
  status: string;
  course_name?: string;
  course_city?: string;
  course_state?: string;
  has_teams?: boolean;
}

const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [addMembersDialogOpen, setAddMembersDialogOpen] = useState(false);
  const [createMatchDialogOpen, setCreateMatchDialogOpen] = useState(false);
  const [teamSetupMatchId, setTeamSetupMatchId] = useState<string | null>(null);
  const [teamSetupFormat, setTeamSetupFormat] = useState<string>('stroke');
  const [matchDetailId, setMatchDetailId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const isOwner = group?.owner_id === user?.id;

  const fetchGroupDetails = async () => {
    if (!groupId) return;

    try {
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .maybeSingle();

      if (groupError) throw groupError;
      if (!groupData) {
        toast({ title: 'Error', description: 'Group not found', variant: 'destructive' });
        navigate('/groups');
        return;
      }

      setGroup(groupData);
      setNewName(groupData.name);

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('id, user_id, gsi')
        .eq('group_id', groupId);

      if (membersError) throw membersError;

      const userIds = (membersData || []).map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
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
        };
      });

      // Sort by GSI ascending (best/lowest first) and calculate relative GHI
      membersList.sort((a, b) => (a.gsi ?? 999) - (b.gsi ?? 999));
      const bestGsi = membersList.length > 0 ? (membersList[0].gsi ?? 0) : 0;
      const membersWithGhi = membersList.map(member => ({
        ...member,
        ghi: member.gsi !== null ? Math.round((member.gsi - bestGsi) * 10) / 10 : null,
      }));

      setMembers(membersWithGhi);

      // Fetch matches with course info
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*, courses(name, city, state)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (matchesError) throw matchesError;

      // Check which matches have teams
      const matchIds = (matchesData || []).map(m => m.id);
      const { data: teamsData } = await supabase
        .from('teams')
        .select('match_id')
        .in('match_id', matchIds);

      const matchesWithTeams = new Set((teamsData || []).map(t => t.match_id));

      const matchesList = (matchesData || []).map(match => ({
        id: match.id,
        format: match.format,
        holes_played: match.holes_played || 18,
        match_date: match.match_date,
        status: match.status,
        course_name: (match.courses as any)?.name,
        course_city: (match.courses as any)?.city,
        course_state: (match.courses as any)?.state,
        has_teams: matchesWithTeams.has(match.id),
      }));

      setMatches(matchesList);
    } catch (error: any) {
      console.error('Error fetching group:', error);
      toast({ title: 'Error', description: 'Failed to load group', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleMatchClick = (match: Match) => {
    if (!match.has_teams) {
      // No teams yet - open team setup
      setTeamSetupMatchId(match.id);
      setTeamSetupFormat(match.format);
    } else {
      // Has teams - open match detail (works for pending and completed)
      setMatchDetailId(match.id);
    }
  };

  const handleRename = async () => {
    if (!groupId || !newName.trim()) return;
    try {
      const { error } = await supabase
        .from('groups')
        .update({ name: newName.trim() })
        .eq('id', groupId);
      if (error) throw error;
      toast({ title: 'Success', description: 'Group renamed successfully' });
      setRenameDialogOpen(false);
      fetchGroupDetails();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to rename group', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!groupId) return;
    try {
      await supabase.from('group_members').delete().eq('group_id', groupId);
      const { error } = await supabase.from('groups').delete().eq('id', groupId);
      if (error) throw error;
      toast({ title: 'Success', description: 'Group deleted successfully' });
      navigate('/groups');
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to delete group', variant: 'destructive' });
    }
  };

  const handleLeave = async () => {
    if (!groupId || !user) return;
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'Success', description: 'You have left the group' });
      navigate('/groups');
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to leave group', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="gradient-primary px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/groups')} className="p-2 rounded-full hover:bg-primary-foreground/10 transition-colors">
          <ArrowLeft className="w-6 h-6 text-primary-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl font-bold text-primary-foreground truncate">{group.name}</h1>
          <p className="text-primary-foreground/80 text-sm">{members.length} {members.length === 1 ? 'member' : 'members'}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-full hover:bg-primary-foreground/10 transition-colors">
              <MoreVertical className="w-6 h-6 text-primary-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {isOwner ? (
              <>
                <DropdownMenuItem onClick={() => setRenameDialogOpen(true)}><Pencil className="w-4 h-4 mr-2" />Rename Group</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Delete Group</DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onClick={() => setLeaveDialogOpen(true)} className="text-destructive"><LogOut className="w-4 h-4 mr-2" />Leave Group</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Members */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Members</h2>
          {isOwner && <Button size="sm" variant="outline" onClick={() => setAddMembersDialogOpen(true)}><UserPlus className="w-4 h-4 mr-1" />Add</Button>}
        </div>
        <div className="space-y-2">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                {member.avatar_url ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground truncate">{member.display_name || 'Anonymous'}</p>
                  {member.user_id === group.owner_id && <Crown className="w-4 h-4 text-accent flex-shrink-0" />}
                  {member.user_id === user?.id && <span className="text-xs text-muted-foreground">(You)</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm text-muted-foreground">Group Handicap:</p>
                <p className="font-semibold text-foreground">
                  {member.ghi !== null ? (member.ghi === 0 ? '0' : `+${member.ghi}`) : 'N/A'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Matches */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Matches</h2>
          <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => setCreateMatchDialogOpen(true)}>+ New Match</Button>
        </div>
        {matches.length > 0 ? (
          <div className="space-y-2">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} onClick={() => handleMatchClick(match)} />
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No matches yet. Create your first match!</p>
          </div>
        )}
      </section>

      {/* Dialogs */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename Group</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Group Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
              <Button className="flex-1 gradient-primary text-primary-foreground" onClick={handleRename} disabled={!newName.trim()}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Group?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{group.name}" and all its match history.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Leave Group?</AlertDialogTitle><AlertDialogDescription>You'll need to be invited again to rejoin.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleLeave} className="bg-destructive text-destructive-foreground">Leave</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddMembersDialog open={addMembersDialogOpen} onOpenChange={setAddMembersDialogOpen} groupId={groupId!} existingMemberIds={members.map(m => m.user_id)} onMembersAdded={fetchGroupDetails} />
      <CreateMatchDialog open={createMatchDialogOpen} onOpenChange={setCreateMatchDialogOpen} groupId={groupId!} onMatchCreated={fetchGroupDetails} />
      <TeamSetupDialog open={!!teamSetupMatchId} onOpenChange={(open) => !open && setTeamSetupMatchId(null)} matchId={teamSetupMatchId || ''} groupId={groupId!} format={teamSetupFormat} onTeamsCreated={fetchGroupDetails} />
      <MatchDetailDialog open={!!matchDetailId} onOpenChange={(open) => !open && setMatchDetailId(null)} matchId={matchDetailId || ''} onMatchUpdated={fetchGroupDetails} />
    </div>
  );
};

export default GroupDetail;