-- Content planner table for social media scheduling
CREATE TABLE IF NOT EXISTS public.content_plans (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date          DATE NOT NULL,
  content_type  TEXT NOT NULL CHECK (content_type IN ('post','story','reel')),
  platform      TEXT NOT NULL DEFAULT 'ig_fb',
  scheduled_time TIME,
  tbc           TEXT,
  status        TEXT NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled','posted','not_posted')),
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_plans_date_idx ON public.content_plans(date);

ALTER TABLE public.content_plans ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "admins_manage_content_plans" ON public.content_plans
  FOR ALL TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Social media managers: full access
CREATE POLICY "smm_manage_content_plans" ON public.content_plans
  FOR ALL TO authenticated
  USING ((SELECT job_role FROM public.profiles WHERE id = auth.uid()) = 'social_media_manager')
  WITH CHECK ((SELECT job_role FROM public.profiles WHERE id = auth.uid()) = 'social_media_manager');
