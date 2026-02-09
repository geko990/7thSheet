-- Add 'data' JSONB column to 'campaign_npcs' table if it doesn't exist
alter table campaign_npcs 
add column if not exists data jsonb default '{}'::jsonb;

-- Comment on column
comment on column campaign_npcs.data is 'Flexible storage for entity details: image_focus, inventory, notes, etc.';
