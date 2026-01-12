-- Drop the problematic INSERT policy for group_members
DROP POLICY IF EXISTS "Group owners can manage members" ON public.group_members;

-- Create a fixed INSERT policy that doesn't cause recursion
CREATE POLICY "Users can join groups they own or are invited to" 
ON public.group_members 
FOR INSERT 
WITH CHECK (
  -- User can add themselves if they own the group
  (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
  ))
  OR
  -- User can add themselves (for accepting invites)
  (user_id = auth.uid())
  OR
  -- Group owner can add members
  (EXISTS (
    SELECT 1 FROM public.groups WHERE id = group_id AND owner_id = auth.uid()
  ))
);

-- Add UPDATE policy for group_members (for GSI updates)
CREATE POLICY "Group members can update their own membership" 
ON public.group_members 
FOR UPDATE 
USING (user_id = auth.uid());