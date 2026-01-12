import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell } from 'lucide-react';

interface NotificationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationSettingsDialog = ({
  open,
  onOpenChange,
}: NotificationSettingsDialogProps) => {
  const [friendRequests, setFriendRequests] = useState(true);
  const [groupInvites, setGroupInvites] = useState(true);
  const [matchUpdates, setMatchUpdates] = useState(true);
  const [scoreChanges, setScoreChanges] = useState(true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="friend-requests">Friend Requests</Label>
                <p className="text-xs text-muted-foreground">
                  When someone sends you a friend request
                </p>
              </div>
              <Switch
                id="friend-requests"
                checked={friendRequests}
                onCheckedChange={setFriendRequests}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="group-invites">Group Invites</Label>
                <p className="text-xs text-muted-foreground">
                  When you're added to a group
                </p>
              </div>
              <Switch
                id="group-invites"
                checked={groupInvites}
                onCheckedChange={setGroupInvites}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="match-updates">Match Updates</Label>
                <p className="text-xs text-muted-foreground">
                  When a new match is created
                </p>
              </div>
              <Switch
                id="match-updates"
                checked={matchUpdates}
                onCheckedChange={setMatchUpdates}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="score-changes">Score Changes</Label>
                <p className="text-xs text-muted-foreground">
                  When match scores are updated
                </p>
              </div>
              <Switch
                id="score-changes"
                checked={scoreChanges}
                onCheckedChange={setScoreChanges}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Note: These settings are stored locally and will apply to future notifications.
          </p>

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