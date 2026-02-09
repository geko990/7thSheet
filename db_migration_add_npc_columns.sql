-- Run this in your Supabase SQL Editor to fix NPC creation
ALTER TABLE campaign_npcs 
ADD COLUMN IF NOT EXISTS level TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'npc',
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Optional Comments
COMMENT ON COLUMN campaign_npcs.level IS 'Power level or rank (e.g., Eroe, Malvagio)';
COMMENT ON COLUMN campaign_npcs.nationality IS 'Nation of origin (e.g., Avalon, Castille)';
COMMENT ON COLUMN campaign_npcs.type IS 'Entity type: npc, enemy, item, etc.';
