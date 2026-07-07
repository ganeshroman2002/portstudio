-- ==========================================
-- PORTSTUDIO DATABASE SCHEMA
-- Execute this entirely in your Supabase SQL Editor
-- ==========================================

-- 1. PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  -- Basic Info
  account_type text default 'talent',
  full_name text,
  username text unique,
  avatar_url text,
  banner_url text,
  headline text,
  bio text,
  location text,
  languages text[],
  availability text,
  notifications_enabled boolean default true,
  
  -- Professional
  primary_category text,
  specializations text[],
  skills text[],
  tools text[],
  certifications text[],
  
  -- Analytics
  profile_views integer default 0,
  portfolio_views integer default 0,
  saved_by_companies integer default 0,
  interview_invites integer default 0,
  
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. PORTFOLIOS (Projects)
create table public.portfolios (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  images text[],
  videos text[],
  live_demo_url text,
  github_url text,
  behance_url text,
  dribbble_url text,
  case_study_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. EXPERIENCES
create table public.experiences (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  company text not null,
  position text not null,
  duration text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. EDUCATIONS
create table public.educations (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  school text not null,
  degree text not null,
  duration text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. SOCIAL LINKS
create table public.social_links (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null unique,
  linkedin text,
  instagram text,
  x_twitter text,
  youtube text,
  website text,
  portfolio text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. ACHIEVEMENTS
create table public.achievements (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  issuer text,
  date_received text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
alter table public.profiles enable row level security;
alter table public.portfolios enable row level security;
alter table public.experiences enable row level security;
alter table public.educations enable row level security;
alter table public.social_links enable row level security;
alter table public.achievements enable row level security;

-- Profiles: Anyone can view, only owner can update/insert
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- Portfolios: Anyone can view, only owner can modify
create policy "Public portfolios are viewable by everyone." on public.portfolios for select using (true);
create policy "Users can insert own portfolios." on public.portfolios for insert with check (auth.uid() = profile_id);
create policy "Users can update own portfolios." on public.portfolios for update using (auth.uid() = profile_id);
create policy "Users can delete own portfolios." on public.portfolios for delete using (auth.uid() = profile_id);

-- Experiences: Anyone can view, only owner can modify
create policy "Public experiences are viewable by everyone." on public.experiences for select using (true);
create policy "Users can insert own experiences." on public.experiences for insert with check (auth.uid() = profile_id);
create policy "Users can update own experiences." on public.experiences for update using (auth.uid() = profile_id);
create policy "Users can delete own experiences." on public.experiences for delete using (auth.uid() = profile_id);

-- Educations: Anyone can view, only owner can modify
create policy "Public educations are viewable by everyone." on public.educations for select using (true);
create policy "Users can insert own educations." on public.educations for insert with check (auth.uid() = profile_id);
create policy "Users can update own educations." on public.educations for update using (auth.uid() = profile_id);
create policy "Users can delete own educations." on public.educations for delete using (auth.uid() = profile_id);

-- Social Links: Anyone can view, only owner can modify
create policy "Public social links are viewable by everyone." on public.social_links for select using (true);
create policy "Users can insert own social links." on public.social_links for insert with check (auth.uid() = profile_id);
create policy "Users can update own social links." on public.social_links for update using (auth.uid() = profile_id);

-- Achievements: Anyone can view, only owner can modify
create policy "Public achievements are viewable by everyone." on public.achievements for select using (true);
create policy "Users can insert own achievements." on public.achievements for insert with check (auth.uid() = profile_id);
create policy "Users can update own achievements." on public.achievements for update using (auth.uid() = profile_id);
create policy "Users can delete own achievements." on public.achievements for delete using (auth.uid() = profile_id);


-- ==========================================
-- TRIGGERS (Auto-create profile on signup)
-- ==========================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  
  insert into public.social_links (profile_id) values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 6. TALENT PITCHES (Showcase Posts)
create table public.talent_pitches (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  persona_type text not null, -- 'job_seeker', 'freelancer', 'influencer'
  cover_banner_url text,
  full_name text not null,
  tagline text not null,
  industry text not null,
  location text not null,
  skills text[],
  about text,
  portfolio_images text[], -- Up to 4 image URLs
  
  -- Job Seeker fields
  desired_job_title text,
  experience_level text,
  notice_period text,
  expected_salary numeric,
  
  -- Freelancer fields
  turnaround_time text,
  hours_available numeric,
  portfolio_link text,
  hourly_rate numeric,
  
  -- Influencer fields
  content_niche text,
  followers_count text,
  engagement_rate text,
  rate_per_post numeric,
  
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ==========================================
-- STORAGE BUCKETS & POLICIES
-- ==========================================
-- Insert the bucket if it doesn't exist
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- FORCE the bucket to be public (in case it was created manually as private)
update storage.buckets set public = true where id = 'avatars';

-- Allow public read access to avatars
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Allow authenticated users to upload their own avatars
create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- Allow users to update their own avatars
create policy "Anyone can update their avatar."
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- ==========================================
-- BANNERS BUCKET
-- ==========================================
insert into storage.buckets (id, name, public) 
values ('banners', 'banners', true)
on conflict (id) do nothing;

update storage.buckets set public = true where id = 'banners';

create policy "Banner images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'banners' );

create policy "Anyone can upload a banner."
  on storage.objects for insert
  with check ( bucket_id = 'banners' and auth.role() = 'authenticated' );

create policy "Anyone can update their banner."
  on storage.objects for update
  using ( bucket_id = 'banners' and auth.role() = 'authenticated' );

-- ==========================================
-- PORTFOLIOS BUCKET (For Showcase Media)
-- ==========================================
insert into storage.buckets (id, name, public) 
values ('portfolios', 'portfolios', true)
on conflict (id) do nothing;

update storage.buckets set public = true where id = 'portfolios';

create policy "Portfolio images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'portfolios' );

create policy "Anyone can upload a portfolio image."
  on storage.objects for insert
  with check ( bucket_id = 'portfolios' and auth.role() = 'authenticated' );

create policy "Anyone can update their portfolio image."
  on storage.objects for update
  using ( bucket_id = 'portfolios' and auth.role() = 'authenticated' );

-- ==========================================
-- MESSAGING & NOTIFICATIONS
-- ==========================================

-- 7. CONVERSATIONS
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  participant1_id uuid references public.profiles(id) on delete cascade not null,
  participant2_id uuid references public.profiles(id) on delete cascade not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(participant1_id, participant2_id)
);

-- 8. MESSAGES
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  attachment_url text,
  attachment_name text,
  read_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 9. NOTIFICATIONS
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade,
  type text not null, -- 'message', 'invite', 'system'
  message text not null,
  link text,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS for Messages & Notifications
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- Conversations: Only participants can view
create policy "Participants can view conversations" on public.conversations for select using (auth.uid() = participant1_id or auth.uid() = participant2_id);
create policy "Participants can insert conversations" on public.conversations for insert with check (auth.uid() = participant1_id or auth.uid() = participant2_id);
create policy "Participants can update conversations" on public.conversations for update using (auth.uid() = participant1_id or auth.uid() = participant2_id);

-- Messages: Only conversation participants can view
create policy "Participants can view messages" on public.messages for select using (
  exists (
    select 1 from public.conversations c 
    where c.id = conversation_id and (c.participant1_id = auth.uid() or c.participant2_id = auth.uid())
  )
);
create policy "Users can send messages" on public.messages for insert with check (auth.uid() = sender_id);
create policy "Users can update read status" on public.messages for update using (
  exists (
    select 1 from public.conversations c 
    where c.id = conversation_id and (c.participant1_id = auth.uid() or c.participant2_id = auth.uid())
  )
);

-- Notifications: Only owner can view/update
create policy "Users can view their notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update their notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "Anyone can insert notifications" on public.notifications for insert with check (true);

-- Message Attachments Bucket
insert into storage.buckets (id, name, public) values ('message_attachments', 'message_attachments', true);
create policy "Anyone can read attachments" on storage.objects for select using ( bucket_id = 'message_attachments' );
create policy "Authenticated users can insert attachments" on storage.objects for insert with check ( bucket_id = 'message_attachments' and auth.role() = 'authenticated' );

-- 11. INTERVIEWS
create table public.interviews (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.profiles(id) on delete cascade not null,
  talent_id uuid references public.profiles(id) on delete cascade not null,
  conversation_id uuid references public.conversations(id) on delete cascade,
  interview_date timestamp with time zone not null,
  status text default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Note: In this dev environment we disabled RLS for these tables previously to prevent friction. 
-- For production, proper RLS policies should be applied here.

-- Premium/Subscription Fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier text default 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS available_pitches integer default 3;
