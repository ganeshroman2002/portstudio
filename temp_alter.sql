ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier text default 'free'; ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS available_pitches integer default 3;
