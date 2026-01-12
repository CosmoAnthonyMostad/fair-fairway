import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Group {
  id: string;
  name: string;
  avatar_url: string | null;
  owner_id: string;
  created_at: string;
  member_count?: number;
}

export const useGroups = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = async () => {
    if (!user) return;
    
    try {
      // Get groups where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        setGroups([]);
        return;
      }

      const groupIds = memberData.map(m => m.group_id);

      // Fetch group details
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);

      if (groupsError) throw groupsError;

      // Get member counts for each group
      const groupsWithCounts = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);
          
          return { ...group, member_count: count || 0 };
        })
      );

      setGroups(groupsWithCounts);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load groups',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (name: string, memberIds?: string[]) => {
    if (!user) return null;

    try {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name,
          owner_id: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Get creator's PHI to initialize GSI
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('phi')
        .eq('user_id', user.id)
        .maybeSingle();

      // Add creator as a member with GSI initialized from PHI
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          gsi: creatorProfile?.phi ?? 20,
        });

      if (memberError) throw memberError;

      // Add selected friends as members with GSI from their PHI
      if (memberIds && memberIds.length > 0) {
        // Get PHI values for all friends
        const { data: friendProfiles } = await supabase
          .from('profiles')
          .select('user_id, phi')
          .in('user_id', memberIds);

        const memberInserts = memberIds.map(userId => {
          const profile = friendProfiles?.find(p => p.user_id === userId);
          return {
            group_id: group.id,
            user_id: userId,
            gsi: profile?.phi ?? 20,
          };
        });

        const { error: friendsError } = await supabase
          .from('group_members')
          .insert(memberInserts);

        if (friendsError) {
          console.error('Error adding friends to group:', friendsError);
          // Don't fail the whole operation, just notify
        }

        // Send group invite notifications to added members
        const notificationInserts = memberIds.map(userId => ({
          user_id: userId,
          type: 'group_invite',
          title: 'Added to Group',
          message: `You were added to the group "${name}"`,
          related_id: group.id,
        }));

        await supabase.from('notifications').insert(notificationInserts);
      }

      toast({
        title: 'Success',
        description: 'Group created successfully!',
      });

      await fetchGroups();
      return group;
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create group',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Group deleted successfully',
      });

      await fetchGroups();
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete group',
        variant: 'destructive',
      });
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'You have left the group',
      });

      await fetchGroups();
    } catch (error: any) {
      console.error('Error leaving group:', error);
      toast({
        title: 'Error',
        description: 'Failed to leave group',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [user]);

  return {
    groups,
    loading,
    createGroup,
    deleteGroup,
    leaveGroup,
    refetch: fetchGroups,
  };
};
