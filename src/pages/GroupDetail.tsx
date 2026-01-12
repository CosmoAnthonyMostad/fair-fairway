import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { AddMembersDialog } from '@/components/groups/AddMembersDialog';
import { CreateMatchDialog } from '@/components/matches/CreateMatchDialog';
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
  Calendar
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
}

interface GroupDetails {
  id: string;
  name: string;
  avatar_url: string | null;
  owner_id: string;
  created_at: string;
}

const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [addMembersDialogOpen, setAddMembersDialogOpen] = useState(false);
  const [createMatchDialogOpen, setCreateMatchDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const isOwner = group?.owner_id === user?.id;

  const fetchGroupDetails = async () => {
    if (!groupId) return;

    try {
      // Fetch group info
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

      // Fetch profiles for members
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

      setMembers(membersList);
    } catch (error: any) {
      console.error('Error fetching group:', error);
      toast({ title: 'Error', description: 'Failed to load group', variant: 'destructive' });
    } finally {
      setLoading(false);
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
      console.error('Error renaming group:', error);
      toast({ title: 'Error', description: 'Failed to rename group', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!groupId) return;

    try {
      // First delete all members
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId);

      // Then delete the group
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Group deleted successfully' });
      navigate('/groups');
    } catch (error: any) {
      console.error('Error deleting group:', error);
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
      console.error('Error leaving group:', error);
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

  if (!group) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="gradient-primary px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/groups')}
          className="p-2 rounded-full hover:bg-primary-foreground/10 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-primary-foreground" />
        </button>
        
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl font-bold text-primary-foreground truncate">
            {group.name}
          </h1>
          <p className="text-primary-foreground/80 text-sm">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </p>
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
                <DropdownMenuItem onClick={() => setRenameDialogOpen(true)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Rename Group
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Group
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem 
                onClick={() => setLeaveDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Leave Group
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Members Section */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Members
          </h2>
          {isOwner && (
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-1"
              onClick={() => setAddMembersDialogOpen(true)}
            >
              <UserPlus className="w-4 h-4" />
              Add
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border"
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.display_name || 'Member'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground truncate">
                    {member.display_name || 'Anonymous'}
                  </p>
                  {member.user_id === group.owner_id && (
                    <Crown className="w-4 h-4 text-accent flex-shrink-0" />
                  )}
                  {member.user_id === user?.id && (
                    <span className="text-xs text-muted-foreground">(You)</span>
                  )}
                </div>
                {member.gsi !== null && (
                  <p className="text-sm text-muted-foreground">
                    GSI: {member.gsi}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Matches Section */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Matches
          </h2>
          <Button 
            size="sm" 
            className="gap-1 gradient-primary text-primary-foreground"
            onClick={() => setCreateMatchDialogOpen(true)}
          >
            + New Match
          </Button>
        </div>

        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            No matches yet. Create your first match!
          </p>
        </div>
      </section>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Group Name</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new name"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setRenameDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 gradient-primary text-primary-foreground"
                onClick={handleRename}
                disabled={!newName.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{group.name}" and all its match history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Confirmation */}
      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave "{group.name}"? You'll need to be invited again to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeave}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Members Dialog */}
      <AddMembersDialog
        open={addMembersDialogOpen}
        onOpenChange={setAddMembersDialogOpen}
        groupId={groupId!}
        existingMemberIds={members.map(m => m.user_id)}
        onMembersAdded={fetchGroupDetails}
      />

      {/* Create Match Dialog */}
      <CreateMatchDialog
        open={createMatchDialogOpen}
        onOpenChange={setCreateMatchDialogOpen}
        groupId={groupId!}
        onMatchCreated={fetchGroupDetails}
      />
    </div>
  );
};

export default GroupDetail;
