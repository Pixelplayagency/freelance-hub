-- Content schedule: a lightweight planning table, separate from content_plans.
-- Admins/SMMs sketch out "what goes up when" (type + time + status + note) for
-- freelancers to see at a glance, without touching the full content_plans
-- production workflow (media/caption/approval).
CREATE TABLE IF NOT EXISTS public.content_schedule (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id      UUID REFERENCES public.content_clients(id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  content_type   TEXT NOT NULL CHECK (content_type IN ('post','story','reel')),
  scheduled_time TIME,
  status         TEXT NOT NULL DEFAULT 'scheduled'
                   CHECK (status IN ('scheduled','posted','not_posted')),
  note           TEXT,
  created_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_schedule_client_date_idx ON public.content_schedule(client_id, date);

ALTER TABLE public.content_schedule ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "admins_manage_content_schedule" ON public.content_schedule
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Social media managers: full access
CREATE POLICY "smm_manage_content_schedule" ON public.content_schedule
  FOR ALL TO authenticated
  USING ((SELECT job_role FROM public.profiles WHERE id = auth.uid()) = 'social_media_manager')
  WITH CHECK ((SELECT job_role FROM public.profiles WHERE id = auth.uid()) = 'social_media_manager');

-- Freelancer reads happen via the service-role client in server components
-- (same pattern as content_plans), so no freelancer SELECT policy is needed here.
