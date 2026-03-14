-- Add media_items array to content_plans for multi-media support
ALTER TABLE public.content_plans
  ADD COLUMN IF NOT EXISTS media_items JSONB NOT NULL DEFAULT '[]';

-- Migrate existing single media into the array
UPDATE public.content_plans
SET media_items = jsonb_build_array(
  jsonb_build_object('url', media_url, 'type', COALESCE(media_type, 'image'))
)
WHERE media_url IS NOT NULL
  AND media_items = '[]'::jsonb;
