import { useAuth } from '@/hooks/useAuth';
import { 
  ChevronRight, 
  Bell, 
  Shield, 
  HelpCircle, 
  FileText, 
  LogOut,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const SettingsItem = ({ 
  icon: Icon, 
  label, 
  onClick 
}: { 
  icon: React.ElementType; 
  label: string; 
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-secondary/50 transition-colors"
  >
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5 text-muted-foreground" />
      <span className="text-foreground">{label}</span>
    </div>
    <ChevronRight className="w-5 h-5 text-muted-foreground" />
  </button>
);

const Settings = () => {
  const { signOut } = useAuth();

  return (
    <>
      {/* Header */}
      <header className="gradient-primary px-4 py-4">
        <h1 className="font-display text-xl font-bold text-primary-foreground">
          Settings
        </h1>
      </header>

      {/* Settings Groups */}
      <section className="py-4">
        <h2 className="px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Account
        </h2>
        <div className="bg-card border-y border-border">
          <SettingsItem icon={User} label="Edit Profile" />
          <div className="h-px bg-border ml-12" />
          <SettingsItem icon={Bell} label="Notifications" />
          <div className="h-px bg-border ml-12" />
          <SettingsItem icon={Shield} label="Privacy" />
        </div>
      </section>

      <section className="py-4">
        <h2 className="px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Support
        </h2>
        <div className="bg-card border-y border-border">
          <SettingsItem icon={HelpCircle} label="Help Center" />
          <div className="h-px bg-border ml-12" />
          <SettingsItem icon={FileText} label="Terms of Service" />
        </div>
      </section>

      {/* Sign Out */}
      <div className="px-4 py-6">
        <Button 
          variant="outline" 
          onClick={signOut} 
          className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>

      {/* App Version */}
      <p className="text-center text-xs text-muted-foreground pb-4">
        Version 1.0.0
      </p>
    </>
  );
};

export default Settings;
