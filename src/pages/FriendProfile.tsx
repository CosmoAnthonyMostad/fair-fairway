import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Trophy, Target, Calendar, MapPin, ArrowLeft, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { MatchQuickViewDialog } from '@/components/matches/MatchQuickViewDialog';

interface ProfileData {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  home_city: string | null;
  phi: number | null;
  total_rounds: number | null;
  total_wins: number | null;
}

interface RecentMatch {
  id: string;
  match_date: string;
  format: string;
  course_name: string;
  is_winner: boolean;
  score: number | null;
  opponent_score: number | null;
  photo_url: string | null;
}

const formatLabel = (matchFormat: string): string => {
  const labels: Record<string, string> = {
    stroke_play: 'Stroke',
    match_play: 'Match',
    '2v2_scramble': 'Scramble',
    best_ball: 'Best Ball',
    shamble: 'Shamble',
  };
  return labels[matchFormat] || matchFormat;
};

const FriendProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculatedStats, setCalculatedStats] = useState({ rounds: 0, wins: 0 });
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profileData) {
          navigate('/groups');
          return;
        }

        setProfile(profileData);

        // Fetch all team_players for this user to calculate stats
        const { data: teamPlayers, error: tpError } = await supabase
          .from('team_players')
          .select('team_id')
          .eq('user_id', userId);

        if (tpError) throw tpError;

        if (teamPlayers && teamPlayers.length > 0) {
          const teamIds = teamPlayers.map(tp => tp.team_id);

          // Get teams with match info
          const { data: teams, error: teamsError } = await supabase
            .from('teams')
            .select('id, match_id, score, is_winner')
            .in('id', teamIds);

          if (teamsError) throw teamsError;

          if (teams && teams.length > 0) {
            const matchIds = [...new Set(teams.map(t => t.match_id))];

            // Get ALL completed matches for stats calculation
            const { data: allCompletedMatches, error: allMatchesError } = await supabase
              .from('matches')
              .select('id')
              .in('id', matchIds)
              .eq('status', 'completed');

            if (allMatchesError) throw allMatchesError;

            // Calculate total rounds and wins from actual match data
            let totalRounds = 0;
            let totalWins = 0;

            if (allCompletedMatches) {
              allCompletedMatches.forEach(match => {
                const userTeam = teams.find(t => t.match_id === match.id);
                if (userTeam) {
                  totalRounds++;
                  if (userTeam.is_winner) {
                    totalWins++;
                  }
                }
              });
            }

            setCalculatedStats({ rounds: totalRounds, wins: totalWins });

            // Get recent matches with course info and photo (limit 10)
            const { data: matches, error: matchesError } = await supabase
              .from('matches')
              .select('id, match_date, format, status, photo_url, courses(name)')
              .in('id', matchIds)
              .eq('status', 'completed')
              .order('match_date', { ascending: false })
              .limit(10);

            if (matchesError) throw matchesError;

            const recentMatchesList: RecentMatch[] = (matches || []).map(match => {
              const team = teams.find(t => t.match_id === match.id);
              const otherTeam = teams.find(t => t.match_id === match.id && t.id !== team?.id);
              
              return {
                id: match.id,
                match_date: match.match_date,
                format: match.format,
                course_name: (match.courses as any)?.name || 'Unknown Course',
                is_winner: team?.is_winner || false,
                score: team?.score || null,
                opponent_score: otherTeam?.score || null,
                photo_url: match.photo_url || null,
              };
            });

            setRecentMatches(recentMatchesList);
          }
        }
      } catch (error) {
        console.error('Error fetching friend profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, navigate]);

  const winRate = calculatedStats.rounds > 0 
    ? Math.round((calculatedStats.wins / calculatedStats.rounds) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="gradient-primary px-4 pb-4 pt-safe">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 mt-4 rounded-full hover:bg-primary-foreground/10 transition-colors mb-2"
        >
          <ArrowLeft className="w-6 h-6 text-primary-foreground" />
        </button>
        
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-primary-foreground/20 flex items-center justify-center border-4 border-primary-foreground/30 overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-primary-foreground" />
            )}
          </div>
          <h1 className="font-display text-xl font-bold text-primary-foreground">
            {profile.display_name || 'Golfer'}
          </h1>
          {profile.home_city && (
            <p className="text-primary-foreground/80 text-sm mt-1 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3" />
              {profile.home_city}
            </p>
          )}
        </div>
      </header>

      {/* Stats */}
      <section className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-secondary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{calculatedStats.rounds}</p>
            <p className="text-xs text-muted-foreground">Rounds</p>
          </div>
          
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-secondary flex items-center justify-center">
              <Trophy className="w-5 h-5 text-accent" />
            </div>
            <p className="text-2xl font-bold text-foreground">{winRate}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
          
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-secondary flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              {profile.phi?.toFixed(1) || '--'}
            </p>
            <p className="text-xs text-muted-foreground">PHI</p>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">
          Recent Activity
        </h2>
        {recentMatches.length > 0 ? (
          <div className="space-y-2">
            {recentMatches.map((match) => (
              <button 
                key={match.id}
                onClick={() => setSelectedMatchId(match.id)}
                className="w-full bg-card rounded-lg border border-border p-3 flex items-center gap-3 hover:border-primary/30 transition-colors text-left"
              >
                {match.photo_url ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={match.photo_url} 
                      alt="Match photo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    match.is_winner 
                      ? 'bg-success/10 text-success' 
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {match.is_winner ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <X className="w-5 h-5" />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">
                    {match.course_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(match.match_date), 'MMM d, yyyy')} • {formatLabel(match.format)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-semibold ${match.is_winner ? 'text-success' : 'text-destructive'}`}>
                    {match.is_winner ? 'Won' : 'Lost'}
                  </p>
                  {match.score !== null && match.opponent_score !== null && (
                    <p className="text-xs text-muted-foreground">
                      {match.score} - {match.opponent_score}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <p className="text-muted-foreground">
              No recent activity to show.
            </p>
          </div>
        )}
      </section>

      <MatchQuickViewDialog
        open={selectedMatchId !== null}
        onOpenChange={(open) => !open && setSelectedMatchId(null)}
        matchId={selectedMatchId}
      />
    </div>
  );
};

export default FriendProfile;