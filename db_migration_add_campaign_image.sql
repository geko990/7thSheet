-- Run this in your Supabase SQL Editor
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Optional: Add a comment
COMMENT ON COLUMN campaigns.image_url IS 'URL for the campaign banner image';
