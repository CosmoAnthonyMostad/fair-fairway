-- Create a secure function for searching users by email
-- This returns user info WITHOUT exposing the actual email to the caller
CREATE OR REPLACE FUNCTION public.search_user_by_email(search_email text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  home_city text,
  phi numeric,
  total_rounds integer,
  total_wins integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.home_city,
    p.phi,
    p.total_rounds,
    p.total_wins,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE LOWER(p.email) = LOWER(search_email)
  LIMIT 1;
$$;

-- Create a public view that excludes email for general profile viewing
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  display_name,
  avatar_url,
  home_city,
  phi,
  total_rounds,
  total_wins,
  created_at,
  updated_at
FROM public.profiles;

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a restrictive policy: users can only see their own full profile (including email)
CREATE POLICY "Users can view their own full profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- Create a policy allowing users to see basic info of friends
CREATE POLICY "Users can view friend profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.status = 'accepted'
    AND (
      (f.requester_id = auth.uid() AND f.addressee_id = profiles.user_id)
      OR (f.addressee_id = auth.uid() AND f.requester_id = profiles.user_id)
    )
  )
);

-- Create a policy allowing users to see group member profiles
CREATE POLICY "Users can view group member profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid()
    AND gm2.user_id = profiles.user_id
  )
);

-- Create a policy for pending friend request profiles (to show requester info)
CREATE POLICY "Users can view pending friend request profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.status = 'pending'
    AND f.addressee_id = auth.uid()
    AND f.requester_id = profiles.user_id
  )
);