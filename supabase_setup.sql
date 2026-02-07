
-- 1. Abilita estensioni
create extension if not exists "uuid-ossp";

-- 2. TABELLA PROFILI (Utenti)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using ( true );
create policy "Users can insert their own profile." on public.profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on public.profiles for update using ( auth.uid() = id );

-- 3. TRIGGER: Crea Profilo alla Registrazione
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. TABELLA CAMPAGNE
create table public.campaigns (
  id uuid default uuid_generate_v4() primary key,
  gm_id uuid references public.profiles(id) not null,
  title text not null,
  join_code text unique default substr(md5(random()::text), 0, 7),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.campaigns enable row level security;
create policy "Campaigns are viewable by everyone." on public.campaigns for select using ( true );
create policy "Users can create campaigns." on public.campaigns for insert with check ( auth.uid() = gm_id );

-- 5. TABELLA PARTECIPANTI
create table public.campaign_members (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('gm', 'player')) not null,
  character_data jsonb,
  joined_at timestamp with time zone default timezone('utc'::text, now()),
  unique(campaign_id, user_id)
);

alter table public.campaign_members enable row level security;
create policy "Members are viewable by everyone." on public.campaign_members for select using (true);
create policy "Users can join campaigns." on public.campaign_members for insert with check ( auth.uid() = user_id );
