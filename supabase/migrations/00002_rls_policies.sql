-- ============================================================
-- 00002_rls_policies.sql
-- ============================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_references   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- PROFILES ----
CREATE POLICY "Own profile readable"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Own profile updatable"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- ---- PROJECTS ----
CREATE POLICY "Admins full project access"
  ON public.projects FOR ALL
  USING (public.is_admin());

CREATE POLICY "Freelancers see their projects"
  ON public.projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.project_id = projects.id
        AND tasks.assigned_to = auth.uid()
    )
  );

-- ---- TASKS ----
CREATE POLICY "Admins full task access"
  ON public.tasks FOR ALL
  USING (public.is_admin());

CREATE POLICY "Freelancers read their tasks"
  ON public.tasks FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "Freelancers update their task status"
  ON public.tasks FOR UPDATE
  USING (assigned_to = auth.uid());

-- ---- TASK REFERENCES ----
CREATE POLICY "Admins full reference access"
  ON public.task_references FOR ALL
  USING (public.is_admin());

CREATE POLICY "Freelancers read references for their tasks"
  ON public.task_references FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_references.task_id
        AND tasks.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Freelancers add notes to their tasks"
  ON public.task_references FOR INSERT
  WITH CHECK (
    type = 'note'
    AND EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_references.task_id
        AND tasks.assigned_to = auth.uid()
    )
  );

-- ---- NOTIFICATIONS ----
CREATE POLICY "Own notifications readable"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Own notifications updatable"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());
