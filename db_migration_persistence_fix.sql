-- Comprehensive Fix for Persistence
-- run this in Supabase SQL Editor

-- 1. Campaigns: Ensure image_url and description
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Campaign Stories: Ensure all fields
CREATE TABLE IF NOT EXISTS campaign_stories (
    id UUID DEFAUL gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    is_visible BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- In case table exists but columns missing:
ALTER TABLE campaign_stories 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT false;

-- 3. Campaign NPCs: Ensure all fields (just to be safe)
ALTER TABLE campaign_npcs 
ADD COLUMN IF NOT EXISTS level TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'npc',
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 4. Enable RLS on Stories if not already
ALTER TABLE campaign_stories ENABLE ROW LEVEL SECURITY;

-- 5. Policies for Stories (Simplified)
CREATE POLICY "Enable read access for all members" ON campaign_stories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM campaign_members 
            WHERE campaign_members.campaign_id = campaign_stories.campaign_id
            AND campaign_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable insert/update/delete for GM" ON campaign_stories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM campaign_members 
            WHERE campaign_members.campaign_id = campaign_stories.campaign_id
            AND campaign_members.user_id = auth.uid()
            AND campaign_members.role = 'gm'
        )
    );
