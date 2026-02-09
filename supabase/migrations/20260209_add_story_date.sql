-- Add 'story_date' column to 'campaign_stories' table if it doesn't exist
alter table campaign_stories 
add column if not exists story_date text;

-- Comment on column
comment on column campaign_stories.story_date is 'Custom date string for the story entry (e.g. "12 Primaverile 1668").';
