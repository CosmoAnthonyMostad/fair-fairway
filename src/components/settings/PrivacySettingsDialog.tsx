import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, ExternalLink } from 'lucide-react';

interface PrivacySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PrivacySettingsDialog = ({
  open,
  onOpenChange,
}: PrivacySettingsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Privacy
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-secondary/50 rounded-lg">
              <h3 className="font-medium text-foreground mb-2">Your Data</h3>
              <p className="text-sm text-muted-foreground">
                We only store the information necessary to provide you with a great golf tracking experience. Your data is encrypted and never shared with third parties.
              </p>
            </div>

            <div className="p-4 bg-secondary/50 rounded-lg">
              <h3 className="font-medium text-foreground mb-2">Profile Visibility</h3>
              <p className="text-sm text-muted-foreground">
                Your profile is only visible to your friends and members of groups you belong to. Your handicap and match history are private.
              </p>
            </div>

            <div className="p-4 bg-secondary/50 rounded-lg">
              <h3 className="font-medium text-foreground mb-2">Account Deletion</h3>
              <p className="text-sm text-muted-foreground">
                To delete your account and all associated data, please contact support at support@mygolfapp.info.
              </p>
            </div>
          </div>

          <Button
            className="w-full gradient-primary text-primary-foreground"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};