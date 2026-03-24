-- Storage policies for client PDF files stored under clients/ prefix
-- Run after 00021_client_pdf.sql

CREATE POLICY "Admins manage client PDFs"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'task-attachments'
    AND name LIKE 'clients/%'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND name LIKE 'clients/%'
    AND public.is_admin()
  );

CREATE POLICY "Social media managers read client PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'task-attachments'
    AND name LIKE 'clients/%'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND job_role = 'social_media_manager'
        AND status = 'active'
    )
  );
