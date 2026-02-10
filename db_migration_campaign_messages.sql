-- Migration: Add campaign_messages table for private messaging between campaign players
-- Run this in Supabase SQL Editor

-- 1. Create messages table
CREATE TABLE IF NOT EXISTS public.campaign_messages (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Enable RLS
ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;

-- 3. Policies: users can read messages they sent or received
CREATE POLICY "Users can view own messages"
    ON public.campaign_messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 4. Users can send messages (insert) as sender
CREATE POLICY "Users can send messages"
    ON public.campaign_messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- 5. Users can mark messages as read (update is_read only)
CREATE POLICY "Users can mark messages as read"
    ON public.campaign_messages FOR UPDATE
    USING (auth.uid() = receiver_id);

-- 6. Users can delete their own sent messages
CREATE POLICY "Users can delete own messages"
    ON public.campaign_messages FOR DELETE
    USING (auth.uid() = sender_id);

-- 7. Index for fast lookups
CREATE INDEX idx_campaign_messages_campaign ON public.campaign_messages(campaign_id);
CREATE INDEX idx_campaign_messages_receiver ON public.campaign_messages(receiver_id, is_read);
CREATE INDEX idx_campaign_messages_pair ON public.campaign_messages(campaign_id, sender_id, receiver_id);
