-- Social media managers manage the content calendar day-to-day, so they
-- should be able to generate/revoke share links and read client notes too,
-- not just admins/managers. Mirrors the smm_manage_content_plans policy.
CREATE POLICY "smm_manage_content_share_links" ON public.content_share_links
  FOR ALL TO authenticated
  USING ((SELECT job_role FROM public.profiles WHERE id = auth.uid()) = 'social_media_manager')
  WITH CHECK ((SELECT job_role FROM public.profiles WHERE id = auth.uid()) = 'social_media_manager');

CREATE POLICY "smm_manage_content_share_notes" ON public.content_share_notes
  FOR ALL TO authenticated
  USING ((SELECT job_role FROM public.profiles WHERE id = auth.uid()) = 'social_media_manager')
  WITH CHECK ((SELECT job_role FROM public.profiles WHERE id = auth.uid()) = 'social_media_manager');
