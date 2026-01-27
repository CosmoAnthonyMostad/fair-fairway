
# Fix Deleted Account Sign-In Issue

## Problem
When a user deletes their account, only their profile data is deleted but the auth user still exists in the authentication system. This allows them to sign in again with the same credentials, just without any data.

## Solution
We need a two-part fix:

### Part 1: Create Edge Function to Delete Auth User
Create a backend function that uses elevated permissions to properly delete the auth user when account deletion is requested.

**New file: `supabase/functions/delete-user/index.ts`**
- Verify the requesting user is authenticated
- Delete all user data from tables (profiles, friendships, etc.)
- Use admin permissions to delete the user from the authentication system
- Return success/error response

### Part 2: Update Delete Account Dialog
Modify `src/components/settings/DeleteAccountDialog.tsx` to:
- Call the new edge function instead of manually deleting from each table
- Handle the response appropriately

### Part 3: Add Sign-In Protection (Fallback)
Update `src/hooks/useAuth.tsx` to add a check after sign-in:
- After successful authentication, verify the user has a profile
- If no profile exists, sign them out and return an error message: "No account found with this email"

This provides a safety net in case:
- The edge function fails to delete the auth user
- There are orphaned auth users from before this fix

## Technical Details

### Edge Function Structure
```text
supabase/functions/delete-user/
└── index.ts
```

The function will:
1. Extract user ID from the authenticated request
2. Delete from all user tables (profiles, friendships, group_members, etc.)
3. Call `supabase.auth.admin.deleteUser(userId)` to remove the auth record
4. Return appropriate status

### Auth Hook Changes
The `signIn` function will be updated to:
1. Attempt sign-in as normal
2. If successful, query for the user's profile
3. If no profile found, sign out and return error "No account found with this email"
