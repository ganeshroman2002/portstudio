-- 1. Ensure the liked_by column exists
ALTER TABLE public.talent_pitches 
ADD COLUMN IF NOT EXISTS liked_by uuid[] DEFAULT '{}'::uuid[];

-- 2. Create a secure function to toggle likes (bypasses RLS so you can like other users' posts)
CREATE OR REPLACE FUNCTION toggle_like(target_pitch_id uuid, target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_likes uuid[];
    is_liked boolean;
BEGIN
    -- Get current liked_by array
    SELECT liked_by INTO current_likes FROM public.talent_pitches WHERE id = target_pitch_id;
    
    IF current_likes IS NULL THEN
        current_likes := '{}'::uuid[];
    END IF;

    -- Check if user already liked
    is_liked := target_user_id = ANY(current_likes);

    IF is_liked THEN
        -- Remove the like
        UPDATE public.talent_pitches 
        SET liked_by = array_remove(current_likes, target_user_id)
        WHERE id = target_pitch_id;
    ELSE
        -- Add the like
        UPDATE public.talent_pitches 
        SET liked_by = array_append(current_likes, target_user_id)
        WHERE id = target_pitch_id;
    END IF;
END;
$$;

