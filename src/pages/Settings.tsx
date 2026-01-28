import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  ChevronRight, 
  Bell, 
  Shield, 
  HelpCircle, 
  FileText, 
  LogOut,
  User,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { NotificationSettingsDialog } from '@/components/settings/NotificationSettingsDialog';
import { PrivacySettingsDialog } from '@/components/settings/PrivacySettingsDialog';
import { HelpCenterDialog } from '@/components/settings/HelpCenterDialog';
import { DeleteAccountDialog } from '@/components/settings/DeleteAccountDialog';
import { useProfile } from '@/hooks/useProfile';

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
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile, updateProfile, uploadAvatar } = useProfile();
  
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  return (
    <>
      {/* Header */}
      <header className="gradient-primary px-4 pb-4 pt-safe">
        <h1 className="font-display text-xl font-bold text-primary-foreground pt-4">
          Settings
        </h1>
      </header>

      {/* Settings Groups */}
      <section className="py-4">
        <h2 className="px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Account
        </h2>
        <div className="bg-card border-y border-border">
          <SettingsItem icon={User} label="Edit Profile" onClick={() => setEditProfileOpen(true)} />
          <div className="h-px bg-border ml-12" />
          <SettingsItem icon={Bell} label="Notifications" onClick={() => setNotificationsOpen(true)} />
          <div className="h-px bg-border ml-12" />
          <SettingsItem icon={Shield} label="Privacy" onClick={() => setPrivacyOpen(true)} />
        </div>
      </section>

      <section className="py-4">
        <h2 className="px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Support
        </h2>
        <div className="bg-card border-y border-border">
          <SettingsItem icon={HelpCircle} label="Help Center" onClick={() => setHelpOpen(true)} />
          <div className="h-px bg-border ml-12" />
          <SettingsItem icon={FileText} label="Terms of Service" onClick={() => navigate('/terms')} />
        </div>
      </section>

      {/* Danger Zone */}
      <section className="py-4">
        <h2 className="px-4 text-sm font-semibold text-destructive uppercase tracking-wide mb-2">
          Danger Zone
        </h2>
        <div className="bg-card border-y border-border">
          <button
            onClick={() => setDeleteAccountOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-destructive/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-destructive" />
              <span className="text-destructive">Delete Account</span>
            </div>
            <ChevronRight className="w-5 h-5 text-destructive/50" />
          </button>
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

      {/* Dialogs */}
      <EditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        profile={profile}
        onSave={updateProfile}
        onUploadAvatar={uploadAvatar}
      />
      <NotificationSettingsDialog 
        open={notificationsOpen} 
        onOpenChange={setNotificationsOpen} 
      />
      <PrivacySettingsDialog 
        open={privacyOpen} 
        onOpenChange={setPrivacyOpen} 
      />
      <HelpCenterDialog 
        open={helpOpen} 
        onOpenChange={setHelpOpen} 
      />
      <DeleteAccountDialog
        open={deleteAccountOpen}
        onOpenChange={setDeleteAccountOpen}
      />
    </>
  );
};

export default Settings;