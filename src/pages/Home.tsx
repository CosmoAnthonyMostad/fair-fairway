import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Bell, Plus, UserPlus, Users, User } from 'lucide-react';

const Home = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-primary px-4 py-4 flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-primary-foreground">
          GOLF APP
        </h1>
        <button className="relative p-2 rounded-full hover:bg-primary-foreground/10 transition-colors">
          <Bell className="w-6 h-6 text-primary-foreground" />
          {/* Notification badge */}
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent rounded-full" />
        </button>
      </header>

      {/* Action buttons */}
      <div className="px-4 py-4 flex gap-3">
        <Button className="flex-1 gradient-primary text-primary-foreground gap-2">
          <Plus className="w-4 h-4" />
          New Group
        </Button>
        <Button variant="outline" className="flex-1 gap-2">
          <UserPlus className="w-4 h-4" />
          Find Friends
        </Button>
      </div>

      {/* Golf Groups Section */}
      <section className="px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">
          Golf Groups
        </h2>
        
        {/* Empty state */}
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">
            No groups yet. Create your first group to start tracking matches!
          </p>
          <Button className="gradient-primary text-primary-foreground gap-2">
            <Plus className="w-4 h-4" />
            Create Group
          </Button>
        </div>
      </section>

      {/* Friends Section */}
      <section className="px-4 py-4">
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">
          Friends
        </h2>
        
        {/* Empty state */}
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">
            Find friends by their email to add them to your groups.
          </p>
          <Button variant="outline" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Find Friends
          </Button>
        </div>
      </section>

      {/* Temporary sign out for testing */}
      <div className="px-4 py-4">
        <Button variant="ghost" onClick={signOut} className="w-full text-muted-foreground">
          Sign Out (temp)
        </Button>
      </div>
    </div>
  );
};

export default Home;