-- Add cover image, avatar, and social media URL columns to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url      TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url   TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url    TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_url      TEXT;
