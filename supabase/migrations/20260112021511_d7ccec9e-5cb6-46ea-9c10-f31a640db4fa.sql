-- Fix infinite recursion in group_members RLS by using SECURITY DEFINER helper functions

-- Helper: check if user is a member of a group (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = _group_id
      AND gm.user_id = _user_id
  );
$$;

-- Helper: check if user is the owner of a group (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_group_owner(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.groups g
    WHERE g.id = _group_id
      AND g.owner_id = _user_id
  );
$$;

-- Replace SELECT policy that self-references group_members (causes recursion)
DROP POLICY IF EXISTS "Group members can view members" ON public.group_members;

CREATE POLICY "Group members can view members"
ON public.group_members
FOR SELECT
USING (public.is_group_member(group_id, auth.uid()));

-- Tighten/replace INSERT policy (avoid overly permissive joins)
DROP POLICY IF EXISTS "Users can join groups they own or are invited to" ON public.group_members;

CREATE POLICY "Group owners can add members"
ON public.group_members
FOR INSERT
WITH CHECK (public.is_group_owner(group_id, auth.uid()));

-- (Keep existing DELETE policy as-is)

-- Ensure there is an UPDATE policy (keep if already exists)
DROP POLICY IF EXISTS "Group members can update their own membership" ON public.group_members;

CREATE POLICY "Group members can update their own membership"
ON public.group_members
FOR UPDATE
USING (user_id = auth.uid());

-- Note: group_members RLS must remain enabled
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;