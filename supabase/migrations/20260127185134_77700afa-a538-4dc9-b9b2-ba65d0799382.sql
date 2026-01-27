-- Fix all GSI values to match PHI for existing group members
-- This corrects the initialization bug where GSI defaulted to 20

UPDATE group_members gm
SET gsi = p.phi
FROM profiles p
WHERE gm.user_id = p.user_id
AND p.phi IS NOT NULL;