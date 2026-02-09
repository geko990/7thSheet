-- Fix Campaign Persistence (Title/Banner)
-- Run this in Supabase SQL Editor

-- Allow GM to update their own campaigns
-- (Previously we only added DELETE, but UPDATE is distinct)
DROP POLICY IF EXISTS "Enable update for users based on gm_id" ON campaigns;
CREATE POLICY "Enable update for users based on gm_id" ON campaigns
    FOR UPDATE USING (auth.uid() = gm_id);

-- While we are here, verify SELECT is not blocking (usually it's public, but good to ensure)
-- CREATE POLICY "Enable read access for all users" ON campaigns FOR SELECT USING (true);
