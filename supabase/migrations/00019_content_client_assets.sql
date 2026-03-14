-- Add branding/asset columns to content_clients
ALTER TABLE public.content_clients
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url      TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url   TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url    TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_url      TEXT,
  ADD COLUMN IF NOT EXISTS description     TEXT,
  ADD COLUMN IF NOT EXISTS color           TEXT NOT NULL DEFAULT '#f24a49';
