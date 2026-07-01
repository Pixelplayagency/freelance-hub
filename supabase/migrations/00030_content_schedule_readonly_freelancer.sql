-- Freelancer (social_media_manager) side must be able to see the schedule but
-- never create/edit/delete it — it's admin-authored. Replace the SMM "FOR ALL"
-- policy with a SELECT-only one; admins keep full access.
DROP POLICY IF EXISTS "smm_manage_content_schedule" ON public.content_schedule;

CREATE POLICY "smm_read_content_schedule" ON public.content_schedule
  FOR SELECT TO authenticated
  USING ((SELECT job_role FROM public.profiles WHERE id = auth.uid()) = 'social_media_manager');
