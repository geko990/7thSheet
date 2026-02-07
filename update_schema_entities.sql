-- Add columns to campaign_npcs to support extended entities
alter table public.campaign_npcs 
add column if not exists nationality text,
add column if not exists level text,
add column if not exists type text default 'npc'; -- 'npc', 'enemy', 'item'

-- Optional: Rename table logic (mental model only, keep table name to avoid data loss)
-- campaign_npcs now acts as campaign_entities
