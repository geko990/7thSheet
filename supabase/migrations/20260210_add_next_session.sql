-- Add next_session column to campaigns
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS next_session TIMESTAMP WITH TIME ZONE;
