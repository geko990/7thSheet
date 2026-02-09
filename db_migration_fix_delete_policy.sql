-- Fix Delete Campaign Policies
-- Run this in Supabase SQL Editor

-- Allow GM to delete their own campaigns
DROP POLICY IF EXISTS "Enable delete for users based on gm_id" ON campaigns;
CREATE POLICY "Enable delete for users based on gm_id" ON campaigns
    FOR DELETE USING (auth.uid() = gm_id);

-- Verify Update Policy
DROP POLICY IF EXISTS "Enable update for users based on gm_id" ON campaigns;
CREATE POLICY "Enable update for users based on gm_id" ON campaigns
    FOR UPDATE USING (auth.uid() = gm_id);

-- Verify Select Policy (should be public or member based)
-- CREATE POLICY "Enable read access for all users" ON campaigns FOR SELECT USING (true);
