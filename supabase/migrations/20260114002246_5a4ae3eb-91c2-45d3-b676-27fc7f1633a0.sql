-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

-- Policy for friend request notifications
-- Only allow creating notifications for users who receive a pending friend request from the creator
CREATE POLICY "Users can create friend request notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  type = 'friend_request' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE requester_id = auth.uid() 
    AND addressee_id = notifications.user_id
    AND status = 'pending'
  )
);

-- Policy for group invite notifications
-- Only allow group members to create invite notifications for users being invited
CREATE POLICY "Users can create group invite notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  type = 'group_invite'
  AND auth.uid() IS NOT NULL
  AND related_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.user_id = auth.uid()
    AND gm.group_id = notifications.related_id
  )
);

-- Policy for group added notifications (when user joins a group)
CREATE POLICY "Users can create group added notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  type = 'group_added'
  AND auth.uid() IS NOT NULL
  AND related_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = notifications.related_id
    AND g.owner_id = auth.uid()
  )
);

-- Policy for match notifications
-- Only group members can create match notifications for other group members
CREATE POLICY "Users can create match notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  type IN ('match_added', 'match_edited')
  AND auth.uid() IS NOT NULL
  AND related_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.matches m
    JOIN public.group_members gm ON gm.group_id = m.group_id
    WHERE m.id = notifications.related_id
    AND gm.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.matches m
    JOIN public.group_members gm ON gm.group_id = m.group_id
    WHERE m.id = notifications.related_id
    AND gm.user_id = notifications.user_id
  )
);