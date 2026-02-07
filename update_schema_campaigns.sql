-- TABELLA STORIE
create table public.campaign_stories (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  title text,
  content text,
  image_url text,
  is_visible boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS Storie
alter table public.campaign_stories enable row level security;

-- GM (creatore campagna) può fare tutto
create policy "GM can manage stories" on public.campaign_stories
for all using (
  exists (
    select 1 from public.campaigns
    where id = campaign_stories.campaign_id
    and gm_id = auth.uid()
  )
);

-- Player (membri campagna) possono vedere solo se is_visible = true
create policy "Players can view visible stories" on public.campaign_stories
for select using (
  is_visible = true 
  and exists (
    select 1 from public.campaign_members
    where campaign_id = campaign_stories.campaign_id
    and user_id = auth.uid()
  )
);

-- TABELLA NPC
create table public.campaign_npcs (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  name text not null,
  description text,
  image_url text,
  is_visible boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS NPC
alter table public.campaign_npcs enable row level security;

-- GM può fare tutto
create policy "GM can manage npcs" on public.campaign_npcs
for all using (
  exists (
    select 1 from public.campaigns
    where id = campaign_npcs.campaign_id
    and gm_id = auth.uid()
  )
);

-- Player possono vedere solo se is_visible = true
create policy "Players can view visible npcs" on public.campaign_npcs
for select using (
  is_visible = true 
  and exists (
    select 1 from public.campaign_members
    where campaign_id = campaign_npcs.campaign_id
    and user_id = auth.uid()
  )
);
