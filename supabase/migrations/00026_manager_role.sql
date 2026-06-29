-- ============================================================
-- 00026_manager_role.sql
-- Adds a third role: 'manager'.
--
-- Managers are admin-tier for projects/tasks/content — they can
-- assign tasks to people, review work, and accept/reject it — but
-- the app hides the Workspace and Discovery areas from them. They
-- can also be assigned tasks themselves (hybrid), so they show up
-- in assignee pickers like freelancers do.
--
-- Run this in the Supabase SQL editor.
-- ============================================================

-- 1. Allow 'manager' in the role check constraint.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'manager', 'freelancer'));

-- 2. Treat managers as admins for RLS. This single change grants the
--    assign-task / review / accept-work powers (full access to
--    projects, tasks, and task_references, plus read-all profiles).
--    Member management still goes through the service role + an
--    app-level admin check, so managers cannot change other roles.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
