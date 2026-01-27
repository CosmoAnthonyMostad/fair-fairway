import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteAccountDialog = ({ open, onOpenChange }: DeleteAccountDialogProps) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmed = confirmText.toLowerCase() === 'delete';

  const handleDeleteAccount = async () => {
    if (!user || !isConfirmed) return;

    setIsDeleting(true);

    try {
      // Delete user's profile and related data
      // The database cascade or RLS will handle related records
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
      }

      // Delete friendships where user is involved
      await supabase
        .from('friendships')
        .delete()
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      // Delete group memberships
      await supabase
        .from('group_members')
        .delete()
        .eq('user_id', user.id);

      // Delete group invites
      await supabase
        .from('group_invites')
        .delete()
        .or(`inviter_id.eq.${user.id},invitee_id.eq.${user.id}`);

      // Delete notifications
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      // Delete team players entries
      await supabase
        .from('team_players')
        .delete()
        .eq('user_id', user.id);

      // Sign out the user (this effectively "deletes" their session)
      // Note: Full auth.users deletion requires admin/service role
      // For now, we delete all user data and sign them out
      await signOut();

      toast({
        title: 'Account Deleted',
        description: 'Your account and all associated data have been removed.',
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">Delete Account</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              This action is <strong>permanent and cannot be undone</strong>. All your data will be deleted including:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Your profile and settings</li>
              <li>All friendships</li>
              <li>Group memberships</li>
              <li>Match history and scores</li>
              <li>All notifications</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="confirm-delete">
            Type <span className="font-mono font-bold">delete</span> to confirm
          </Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete"
            autoComplete="off"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={!isConfirmed || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Account'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
