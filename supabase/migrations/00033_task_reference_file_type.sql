-- Admin wants a dedicated "Files" area on tasks (docs, PDFs, logo SVGs/PNGs)
-- separate from the existing image/video/link reference types.
ALTER TABLE public.task_references DROP CONSTRAINT IF EXISTS task_references_type_check;
ALTER TABLE public.task_references ADD CONSTRAINT task_references_type_check
  CHECK (type IN ('image', 'link', 'video', 'note', 'file'));
