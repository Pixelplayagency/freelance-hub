-- Add reference link field to content_clients
ALTER TABLE public.content_clients
  ADD COLUMN IF NOT EXISTS content_plan_link TEXT;
