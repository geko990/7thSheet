-- Fix Character Linking logic
-- Run this in Supabase SQL Editor

-- 1. Ensure character_data column exists
ALTER TABLE campaign_members 
ADD COLUMN IF NOT EXISTS character_data JSONB;

-- 2. Allow users to update their OWN member record (to link character)
-- First, drop existing update policy if it restricts this
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON campaign_members;

-- Create new policy
CREATE POLICY "Enable update for users based on user_id" ON campaign_members
    FOR UPDATE USING (auth.uid() = user_id);

-- 3. Verify Select Policy (should be public or member based)
-- CREATE POLICY "Enable read access for all users" ON campaign_members FOR SELECT USING (true);
