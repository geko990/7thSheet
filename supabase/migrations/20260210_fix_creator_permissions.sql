-- POLICY: Allow Creator (gm_id) or GM (role='gm') to UPDATE campaign_members
-- Drop existing policy if names collide or are generic, but best to create a new specific one or replace.
-- Assuming standard CRUD policies exist. Let's make a comprehensive one for admin actions.

DROP POLICY IF EXISTS "Enable update for GMs" ON "public"."campaign_members";
DROP POLICY IF EXISTS "Enable delete for GMs" ON "public"."campaign_members";
DROP POLICY IF EXISTS "Admins can update members" ON "public"."campaign_members";
DROP POLICY IF EXISTS "Admins can delete members" ON "public"."campaign_members";


-- UPDATE POLICY
CREATE POLICY "Admins can update members"
ON "public"."campaign_members"
FOR UPDATE 
USING (
  auth.uid() IN (
    -- User is a GM in this campaign
    SELECT user_id FROM campaign_members 
    WHERE campaign_id = campaign_members.campaign_id AND role = 'gm'
  )
  OR
  auth.uid() IN (
    -- User is the Creator (gm_id) of the campaign
    SELECT gm_id FROM campaigns
    WHERE id = campaign_members.campaign_id
  )
);

-- DELETE POLICY
CREATE POLICY "Admins can delete members"
ON "public"."campaign_members"
FOR DELETE
USING (
  auth.uid() IN (
    -- User is a GM in this campaign
    SELECT user_id FROM campaign_members 
    WHERE campaign_id = campaign_members.campaign_id AND role = 'gm'
  )
  OR
  auth.uid() IN (
    -- User is the Creator (gm_id) of the campaign
    SELECT gm_id FROM campaigns
    WHERE id = campaign_members.campaign_id
  )
);
