-- Custom thumbnail for reels/videos — separate from the video file itself,
-- either extracted from a frame of the video or manually uploaded.
ALTER TABLE public.content_plans ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
