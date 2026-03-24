-- Add content plan PDF storage path to content_clients
ALTER TABLE public.content_clients
  ADD COLUMN IF NOT EXISTS content_plan_pdf_path TEXT;
