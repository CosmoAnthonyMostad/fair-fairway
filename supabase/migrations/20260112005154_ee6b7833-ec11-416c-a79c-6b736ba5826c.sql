-- Fix the notifications INSERT policy to be more restrictive
-- Allow authenticated users to create notifications (for friend requests, etc.)
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Authenticated users can create notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);