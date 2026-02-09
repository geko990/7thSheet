-- Add 'image_url' column to 'campaign_stories' table if it doesn't exist
alter table campaign_stories 
add column if not exists image_url text;

-- Comment on column
comment on column campaign_stories.image_url is 'URL of the image attached to the story entry.';
