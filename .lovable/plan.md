

# Simplify Delete Account Dialog

## What We're Changing
Removing the "type delete to confirm" text input requirement and allowing users to delete their account with just a button click.

## Changes

### DeleteAccountDialog.tsx
1. Remove the `confirmText` state variable
2. Remove the `isConfirmed` check
3. Remove the text input section (Label + Input)
4. Remove the `!isConfirmed` check from the button's disabled state
5. Update `handleDeleteAccount` to just check for `user` instead of `user && isConfirmed`
6. Remove unused `Input` and `Label` imports

The dialog will still show the warning about what data will be deleted, and users can still cancel - they just won't need to type anything to confirm.

