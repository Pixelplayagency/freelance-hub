-- ============================================================
-- 00027_manager_delete_restrictions.sql
--
-- Managers have admin-tier *work* powers (via is_admin()), but they must NOT be
-- able to delete whole projects, content clients, or content posts, nor delete
-- tasks they did not create. They keep: deleting tasks they gave out, task
-- attachments/references, and task assignments (un-assigning freelancers).
--
-- The server actions already enforce this, but a logged-in manager also holds a
-- Supabase client in the browser and could call .delete() directly — so the
-- real enforcement has to live in RLS. This splits the broad admin "FOR ALL"
-- policies on projects/tasks so DELETE is gated separately from read/write.
-- ============================================================

-- Helper: full admin only (excludes managers). is_admin() still = admin OR manager.
CREATE OR REPLACE FUNCTION public.is_full_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- PROJECTS: admins + managers read/write, only admins delete ----
DROP POLICY IF EXISTS "Admins full project access" ON public.projects;

CREATE POLICY "Admins and managers read projects"
  ON public.projects FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins and managers create projects"
  ON public.projects FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins and managers update projects"
  ON public.projects FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Only admins delete projects"
  ON public.projects FOR DELETE
  USING (public.is_full_admin());

-- ---- TASKS: admins + managers read/write; admins delete any, managers only their own ----
DROP POLICY IF EXISTS "Admins full task access" ON public.tasks;

CREATE POLICY "Admins and managers read tasks"
  ON public.tasks FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins and managers create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins and managers update tasks"
  ON public.tasks FOR UPDATE
  USING (public.is_admin());

-- Admins delete anything; managers only tasks they created (gave out).
-- Freelancers never have INSERT on tasks, so created_by is never theirs.
CREATE POLICY "Admins delete any task, managers delete own"
  ON public.tasks FOR DELETE
  USING (public.is_full_admin() OR created_by = auth.uid());

-- task_references stays on is_admin() (admins + managers) — task attachments are
-- "basics" a manager is allowed to manage. content_clients / content_plans are
-- already restricted to role = 'admin' directly, so managers cannot delete them.
