import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Trophy } from 'lucide-react';
import ogBackground from '@/assets/og-golf-background.jpg';

interface MatchData {
  id: string;
  format: string;
  match_date: string;
  status: string;
  course: {
    name: string;
    city: string | null;
    state: string | null;
  } | null;
  winnerNames: string[];
  winningScore: number | null;
  winningNetScore: number | null;
}

const formatLabel = (format: string): string => {
  const labels: Record<string, string> = {
    stroke_play: 'Stroke Play',
    match_play: 'Match Play',
    '2v2_scramble': 'Scramble',
    best_ball: 'Best Ball',
    shamble: 'Shamble',
  };
  return labels[format] || format;
};

const ShareMatch = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatch = async () => {
      if (!matchId) return;

      try {
        // Fetch match with course
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select('*, courses(name, city, state)')
          .eq('id', matchId)
          .maybeSingle();

        if (matchError || !matchData) {
          setLoading(false);
          return;
        }

        // Fetch winning team
        const { data: teams } = await supabase
          .from('teams')
          .select('*, team_players(user_id)')
          .eq('match_id', matchId)
          .eq('is_winner', true);

        let winnerNames: string[] = [];
        let winningScore: number | null = null;
        let winningNetScore: number | null = null;

        if (teams && teams.length > 0) {
          const winningTeam = teams[0];
          winningScore = winningTeam.score;
          winningNetScore = winningTeam.score !== null && winningTeam.handicap_strokes !== null
            ? winningTeam.score - winningTeam.handicap_strokes
            : null;

          const playerIds = winningTeam.team_players?.map((p: any) => p.user_id) || [];
          
          if (playerIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('display_name')
              .in('user_id', playerIds);

            winnerNames = profiles?.map(p => p.display_name?.split(' ')[0] || 'Player') || [];
          }
        }

        setMatch({
          id: matchData.id,
          format: matchData.format,
          match_date: matchData.match_date,
          status: matchData.status,
          course: matchData.courses as any,
          winnerNames,
          winningScore,
          winningNetScore,
        });
      } catch (error) {
        console.error('Error fetching match:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [matchId]);

  // Update document title and meta tags
  useEffect(() => {
    if (match) {
      const title = match.winnerNames.length > 0
        ? `${match.winnerNames.join(' & ')} won at ${match.course?.name || 'the course'}!`
        : `Golf Match at ${match.course?.name || 'the course'}`;
      document.title = title;
    }
  }, [match]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Match Not Found</h1>
          <p className="text-muted-foreground">This match may have been deleted or doesn't exist.</p>
        </div>
      </div>
    );
  }

  const matchDate = new Date(match.match_date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Share Card */}
      <div className="w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl">
        <div 
          className="relative aspect-[1.875] bg-cover bg-center"
          style={{ backgroundImage: `url(${ogBackground})` }}
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          
          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            {/* Trophy icon */}
            <div className="mb-4">
              <div className="w-16 h-16 rounded-full bg-accent/20 backdrop-blur-sm flex items-center justify-center">
                <Trophy className="w-8 h-8 text-accent" />
              </div>
            </div>

            {/* Winner announcement */}
            {match.winnerNames.length > 0 ? (
              <>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                  {match.winnerNames.join(' & ')} Won!
                </h1>
                {match.winningScore !== null && (
                  <p className="text-xl text-white/90 mb-4 drop-shadow">
                    Score: {match.winningScore}
                    {match.winningNetScore !== null && match.winningNetScore !== match.winningScore && (
                      <span className="text-white/70"> (Net {match.winningNetScore})</span>
                    )}
                  </p>
                )}
              </>
            ) : (
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow-lg">
                Golf Match
              </h1>
            )}

            {/* Match details */}
            <div className="text-white/80 text-sm md:text-base drop-shadow">
              <p className="font-medium">{match.course?.name || 'Unknown Course'}</p>
              <p>{formatLabel(match.format)} • {matchDate}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareMatch;
