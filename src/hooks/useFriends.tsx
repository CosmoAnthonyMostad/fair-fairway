import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Friend {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  friendship_id: string;
}

export interface FriendRequest {
  id: string;
  requester_id: string;
  requester_name: string | null;
  requester_avatar: string | null;
  created_at: string;
}

export const useFriends = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = async () => {
    if (!user) return;

    try {
      // Get accepted friendships where user is either requester or addressee
      const { data: friendships, error: friendError } = await supabase
        .from('friendships')
        .select('*')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (friendError) throw friendError;

      if (!friendships || friendships.length === 0) {
        setFriends([]);
      } else {
        // Get friend user IDs
        const friendIds = friendships.map(f => 
          f.requester_id === user.id ? f.addressee_id : f.requester_id
        );

        // Fetch profiles
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', friendIds);

        if (profileError) throw profileError;

        const friendsList = (profiles || []).map(profile => {
          const friendship = friendships.find(f => 
            f.requester_id === profile.user_id || f.addressee_id === profile.user_id
          );
          return {
            id: profile.id,
            user_id: profile.user_id,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            friendship_id: friendship?.id || '',
          };
        });

        setFriends(friendsList);
      }

      // Get pending friend requests (where user is addressee)
      const { data: requests, error: requestError } = await supabase
        .from('friendships')
        .select('*')
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

      if (requestError) throw requestError;

      if (!requests || requests.length === 0) {
        setPendingRequests([]);
      } else {
        const requesterIds = requests.map(r => r.requester_id);

        const { data: requesterProfiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', requesterIds);

        if (profileError) throw profileError;

        const pendingList = requests.map(request => {
          const profile = requesterProfiles?.find(p => p.user_id === request.requester_id);
          return {
            id: request.id,
            requester_id: request.requester_id,
            requester_name: profile?.display_name || null,
            requester_avatar: profile?.avatar_url || null,
            created_at: request.created_at,
          };
        });

        setPendingRequests(pendingList);
      }
    } catch (error: any) {
      console.error('Error fetching friends:', error);
      toast({
        title: 'Error',
        description: 'Failed to load friends',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const searchUserByEmail = async (email: string) => {
    try {
      // First check if there's a user with this email
      const { data: authData } = await supabase.auth.admin?.listUsers?.() || { data: null };
      
      // Since we can't access auth.users, we search profiles
      // Users need to have set up their profile with a display_name that matches or search by email pattern
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;

      // Filter out current user and existing friends
      const filteredProfiles = (profiles || []).filter(p => {
        if (p.user_id === user?.id) return false;
        if (friends.some(f => f.user_id === p.user_id)) return false;
        return true;
      });

      return filteredProfiles;
    } catch (error: any) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  const sendFriendRequest = async (addresseeId: string) => {
    if (!user) return false;

    try {
      // Check if friendship already exists
      const { data: existing, error: existingError } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        toast({
          title: 'Already connected',
          description: 'You already have a friendship with this user',
        });
        return false;
      }

      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: addresseeId,
          status: 'pending',
        });

      if (error) throw error;

      // Create notification for the addressee
      await supabase
        .from('notifications')
        .insert({
          user_id: addresseeId,
          type: 'friend_request',
          title: 'New Friend Request',
          message: 'You have a new friend request',
          related_id: user.id,
        });

      toast({
        title: 'Success',
        description: 'Friend request sent!',
      });

      return true;
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to send friend request',
        variant: 'destructive',
      });
      return false;
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Friend request accepted!',
      });

      await fetchFriends();
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept friend request',
        variant: 'destructive',
      });
    }
  };

  const declineFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: 'Declined',
        description: 'Friend request declined',
      });

      await fetchFriends();
    } catch (error: any) {
      console.error('Error declining friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline friend request',
        variant: 'destructive',
      });
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;

      toast({
        title: 'Removed',
        description: 'Friend removed',
      });

      await fetchFriends();
    } catch (error: any) {
      console.error('Error removing friend:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove friend',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [user]);

  return {
    friends,
    pendingRequests,
    loading,
    searchUserByEmail,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    refetch: fetchFriends,
  };
};
