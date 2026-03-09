-- ============================================================
-- 00007_freelancer_status.sql
-- Adds approval workflow for freelancers
-- Run in Supabase Dashboard > SQL Editor
-- ============================================================

-- Add status column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'removed'));

-- All existing users are already approved (grandfathered in)
UPDATE public.profiles SET status = 'active';

-- Update handle_new_user trigger to read status from auth metadata
-- Invited users (via admin) will have status='active' in metadata
-- Self-signed-up users will default to 'pending'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'freelancer'),
    COALESCE(NEW.raw_user_meta_data->>'status', 'pending')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
