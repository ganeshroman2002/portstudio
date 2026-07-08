ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notifications_enabled boolean default true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS purchased_pitches integer default 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type text default 'talent';
NOTIFY pgrst, 'reload schema';

-- Fix existing company profiles that might be missing the account_type
UPDATE public.profiles
SET account_type = 'company'
WHERE id IN (
  SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'company'
);
