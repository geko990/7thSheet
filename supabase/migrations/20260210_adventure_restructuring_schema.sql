-- Create campaign_quests table
CREATE TABLE IF NOT EXISTS public.campaign_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active', -- 'active' | 'completed' | 'failed'
    reward_xp INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.campaign_quests ENABLE ROW LEVEL SECURITY;

-- Policies for campaign_quests
CREATE POLICY "Quest visibility for members" ON public.campaign_quests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.campaign_members 
            WHERE campaign_id = campaign_quests.campaign_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "GM can manage quests" ON public.campaign_quests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.campaign_members 
            WHERE campaign_id = campaign_quests.campaign_id AND user_id = auth.uid() AND role = 'gm'
        )
    );

-- Adjust campaign_messages to allow Group Chat (receiver_id is null for group messages)
-- Note: Assuming campaign_messages already exists from CampaignService.js usage
-- If it doesn't exist, we should create it. Based on CampaignService.js it does.
-- Let's make sure the receiver_id can be NULL.
ALTER TABLE public.campaign_messages ALTER COLUMN receiver_id DROP NOT NULL;

-- If campaign_messages doesn't exist yet, we create it here (idempotent)
CREATE TABLE IF NOT EXISTS public.campaign_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL means Group Chat
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Policies for campaign_messages (Group Chat)
-- Current policy might only allow private messages. We need to allow selecting messages where receiver_id IS NULL.
DROP POLICY IF EXISTS "Messages visibility for participants" ON public.campaign_messages;
CREATE POLICY "Messages visibility for participants" ON public.campaign_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.campaign_members 
            WHERE campaign_id = campaign_messages.campaign_id AND user_id = auth.uid()
        ) AND (
            receiver_id IS NULL OR sender_id = auth.uid() OR receiver_id = auth.uid()
        )
    );
