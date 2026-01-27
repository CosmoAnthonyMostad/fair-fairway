import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  home_city: string | null;
  phi: number | null;
  total_rounds: number;
  total_wins: number;
  created_at: string;
  updated_at: string;
}

export interface RecentMatch {
  id: string;
  match_date: string;
  course_name: string;
  format: string;
  is_winner: boolean;
  score: number | null;
  opponent_score: number | null;
  photo_url: string | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch base profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profileData) {
        setProfile(null);
        return;
      }

      // Fetch user's team participation with match details
      const { data: participationData } = await supabase
        .from('team_players')
        .select(`
          team_id,
          teams!inner(
            id,
            match_id,
            team_number,
            is_winner,
            score,
            matches!inner(
              id,
              match_date,
              status,
              format,
              photo_url,
              courses(name)
            )
          )
        `)
        .eq('user_id', user.id);

      // Process data for stats and recent matches
      let totalRounds = 0;
      let totalWins = 0;
      const matchDetails: RecentMatch[] = [];
      const countedMatches = new Set<string>();

      for (const tp of participationData || []) {
        const team = tp.teams as any;
        const match = team?.matches;
        const matchId = team?.match_id;

        if (match?.status === 'completed' && matchId && !countedMatches.has(matchId)) {
          countedMatches.add(matchId);
          totalRounds++;
          if (team.is_winner) {
            totalWins++;
          }

          // Get opponent score for this match
          const { data: opponentTeam } = await supabase
            .from('teams')
            .select('score')
            .eq('match_id', matchId)
            .neq('id', team.id)
            .maybeSingle();

          matchDetails.push({
            id: matchId,
            match_date: match.match_date,
            course_name: match.courses?.name || 'Unknown Course',
            format: match.format,
            is_winner: team.is_winner,
            score: team.score,
            opponent_score: opponentTeam?.score || null,
            photo_url: match.photo_url || null,
          });
        }
      }

      // Sort by date descending and take last 5
      matchDetails.sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());
      setRecentMatches(matchDetails.slice(0, 5));

      setProfile({
        ...profileData,
        total_rounds: totalRounds,
        total_wins: totalWins,
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      await fetchProfile();
      return true;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update profile',
        variant: 'destructive',
      });
      return false;
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete existing avatar if any
      await supabase.storage.from('avatars').remove([fileName]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;
      await updateProfile({ avatar_url: avatarUrl });

      return avatarUrl;
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to upload avatar',
        variant: 'destructive',
      });
      return null;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    recentMatches,
    loading,
    updateProfile,
    uploadAvatar,
    refetch: fetchProfile,
  };
};