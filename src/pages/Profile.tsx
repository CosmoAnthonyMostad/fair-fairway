import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { User, Trophy, Target, Calendar, MapPin, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { format } from 'date-fns';

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

const Profile = () => {
  const { user } = useAuth();
  const { profile, recentMatches, loading, updateProfile, uploadAvatar } = useProfile();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Win rate = wins / rounds
  const winRate = profile?.total_rounds && profile.total_rounds > 0 
    ? Math.round((profile.total_wins || 0) / profile.total_rounds * 100) 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="gradient-primary px-4 pb-6 pt-safe text-center">
        <div className="w-24 h-24 mx-auto mb-3 mt-4 rounded-full bg-primary-foreground/20 flex items-center justify-center border-4 border-primary-foreground/30 overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-12 h-12 text-primary-foreground" />
          )}
        </div>
        <h1 className="font-display text-xl font-bold text-primary-foreground">
          {profile?.display_name || user?.email?.split('@')[0] || 'Golfer'}
        </h1>
        {profile?.home_city && (
          <p className="text-primary-foreground/80 text-sm mt-1 flex items-center justify-center gap-1">
            <MapPin className="w-3 h-3" />
            {profile.home_city}
          </p>
        )}
      </header>

      {/* Stats */}
      <section className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-secondary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{profile?.total_rounds || 0}</p>
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
              {profile?.phi?.toFixed(1) || '--'}
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
              <div 
                key={match.id} 
                className="bg-card rounded-lg border border-border p-3 flex items-center gap-3"
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
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <p className="text-muted-foreground">
              No recent activity. Play a match to see your stats!
            </p>
          </div>
        )}
      </section>

      {/* Edit Profile Button */}
      <div className="px-4 py-4">
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setEditDialogOpen(true)}
        >
          Edit Profile
        </Button>
      </div>

      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        profile={profile}
        onSave={updateProfile}
        onUploadAvatar={uploadAvatar}
      />
    </>
  );
};

export default Profile;