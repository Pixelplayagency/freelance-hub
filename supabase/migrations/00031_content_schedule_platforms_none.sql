-- Schedule cards need to show which platform(s) content goes to, and support
-- a "No content" marker (grey) for days with nothing scheduled.
ALTER TABLE public.content_schedule ADD COLUMN IF NOT EXISTS platforms TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.content_schedule DROP CONSTRAINT IF EXISTS content_schedule_content_type_check;
ALTER TABLE public.content_schedule ADD CONSTRAINT content_schedule_content_type_check
  CHECK (content_type IN ('post', 'story', 'reel', 'none'));
