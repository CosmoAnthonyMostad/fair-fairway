import { useAuth } from '@/hooks/useAuth';
import { User, Trophy, Target, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Profile = () => {
  const { user } = useAuth();

  return (
    <>
      {/* Header */}
      <header className="gradient-primary px-4 py-6 text-center">
        <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-primary-foreground/20 flex items-center justify-center border-4 border-primary-foreground/30">
          <User className="w-12 h-12 text-primary-foreground" />
        </div>
        <h1 className="font-display text-xl font-bold text-primary-foreground">
          {user?.email?.split('@')[0] || 'Golfer'}
        </h1>
        <p className="text-primary-foreground/80 text-sm mt-1">
          {user?.email}
        </p>
      </header>

      {/* Stats */}
      <section className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-secondary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">Rounds</p>
          </div>
          
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-secondary flex items-center justify-center">
              <Trophy className="w-5 h-5 text-accent" />
            </div>
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">Wins</p>
          </div>
          
          <div className="bg-card rounded-lg border border-border p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-secondary flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">--</p>
            <p className="text-xs text-muted-foreground">PHI</p>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">
          Recent Activity
        </h2>
        
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">
            No recent activity. Play a match to see your stats!
          </p>
        </div>
      </section>

      {/* Edit Profile Button */}
      <div className="px-4 py-4">
        <Button variant="outline" className="w-full">
          Edit Profile
        </Button>
      </div>
    </>
  );
};

export default Profile;
