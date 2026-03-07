-- ============================================================
-- 00003_storage_policies.sql
-- Run AFTER creating the 'task-attachments' bucket in Dashboard
-- ============================================================

-- Create bucket (run if not created via Dashboard):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('task-attachments', 'task-attachments', false);

CREATE POLICY "Admins upload task attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND public.is_admin()
  );

CREATE POLICY "Freelancers upload to their task folders"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = (string_to_array(name, '/'))[1]::UUID
        AND tasks.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Task participants read attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'task-attachments'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.tasks
        WHERE tasks.id = (string_to_array(name, '/'))[1]::UUID
          AND tasks.assigned_to = auth.uid()
      )
    )
  );

CREATE POLICY "Admins delete task attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'task-attachments'
    AND public.is_admin()
  );
