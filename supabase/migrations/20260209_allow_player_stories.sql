-- Migration to allow players to write stories and track authorship

-- 1. Add author_id column to campaign_stories
ALTER TABLE public.campaign_stories 
ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES public.profiles(id);

-- Set default author for existing stories to the Campaign GM (best guess cleanup)
-- We can do this by looking up campaign.gm_id
UPDATE public.campaign_stories cs
SET author_id = c.gm_id
FROM public.campaigns c
WHERE cs.campaign_id = c.id
AND cs.author_id IS NULL;

-- 2. Drop existing policies to recreate them with new logic
DROP POLICY IF EXISTS "GM can manage stories" ON public.campaign_stories;
DROP POLICY IF EXISTS "Players can view visible stories" ON public.campaign_stories;

-- 3. Create new Policies

-- SELECT: Visible to everyone in campaign OR if you are the author OR GM
CREATE POLICY "Stories viewable by members" ON public.campaign_stories
FOR SELECT USING (
  -- Existing logic: visible flag + membership
  (is_visible = true AND exists (
    SELECT 1 FROM public.campaign_members
    WHERE campaign_id = campaign_stories.campaign_id
    AND user_id = auth.uid()
  ))
  OR
  -- New logic: You are the author
  (author_id = auth.uid())
  OR
  -- New logic: You are the GM
  (exists (
    SELECT 1 FROM public.campaigns
    WHERE id = campaign_stories.campaign_id
    AND gm_id = auth.uid()
  ))
);

-- INSERT: Allowed for any campaign member
CREATE POLICY "Members can create stories" ON public.campaign_stories
FOR INSERT WITH CHECK (
  exists (
    SELECT 1 FROM public.campaign_members
    WHERE campaign_id = campaign_stories.campaign_id
    AND user_id = auth.uid()
  )
  -- Optional: Enforce that author_id is you
  AND author_id = auth.uid()
);

-- UPDATE: Allowed for author OR GM
CREATE POLICY "Authors and GM can update stories" ON public.campaign_stories
FOR UPDATE USING (
  -- Author
  (author_id = auth.uid())
  OR
  -- GM
  (exists (
    SELECT 1 FROM public.campaigns
    WHERE id = campaign_stories.campaign_id
    AND gm_id = auth.uid()
  ))
);

-- DELETE: Allowed for author OR GM
CREATE POLICY "Authors and GM can delete stories" ON public.campaign_stories
FOR DELETE USING (
  -- Author
  (author_id = auth.uid())
  OR
  -- GM
  (exists (
    SELECT 1 FROM public.campaigns
    WHERE id = campaign_stories.campaign_id
    AND gm_id = auth.uid()
  ))
);
