-- ============================================================
-- cleanup_and_optimize.sql
-- Run in Supabase Dashboard → SQL Editor
-- Safe to run multiple times (all idempotent)
-- ============================================================

-- ----------------------------------------------------------------
-- PART 1 — DATA CLEANUP (remove junk rows)
-- ----------------------------------------------------------------

-- 1. Delete expired invite tokens that were never used
DELETE FROM public.invite_tokens
WHERE expires_at < now()
  AND used_by IS NULL;

-- 2. Delete used invite tokens older than 30 days (no longer needed)
DELETE FROM public.invite_tokens
WHERE used_by IS NOT NULL
  AND used_at < now() - INTERVAL '30 days';

-- 3. Delete read notifications older than 60 days
DELETE FROM public.notifications
WHERE read = true
  AND created_at < now() - INTERVAL '60 days';

-- 4. Clean orphaned task_assignments where the task no longer exists
--    (safety net — CASCADE should handle this, but just in case)
DELETE FROM public.task_assignments
WHERE task_id NOT IN (SELECT id FROM public.tasks);

-- 5. Clean orphaned project_media where the project no longer exists
DELETE FROM public.project_media
WHERE project_id NOT IN (SELECT id FROM public.projects);

-- 6. Remove removed/inactive freelancer sessions won't matter,
--    but clean their unread notifications (they can't log in anyway)
DELETE FROM public.notifications n
WHERE n.user_id IN (
  SELECT id FROM public.profiles
  WHERE status = 'removed'
);

-- ----------------------------------------------------------------
-- PART 2 — MISSING INDEXES (idempotent with IF NOT EXISTS)
-- ----------------------------------------------------------------

-- Composite index for project board queries (tasks by project + status)
CREATE INDEX IF NOT EXISTS idx_tasks_project_status
  ON public.tasks(project_id, status);

-- Index for due-date queries (overdue / due-soon checks)
CREATE INDEX IF NOT EXISTS idx_tasks_due_date
  ON public.tasks(due_date)
  WHERE due_date IS NOT NULL;

-- task_assignments: lookup by user (freelancer "my tasks" queries)
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id
  ON public.task_assignments(user_id);

-- task_assignments: lookup by task (admin "who's assigned" queries)
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id
  ON public.task_assignments(task_id);

-- invite_tokens: fast token lookup on join page
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token
  ON public.invite_tokens(token);

-- invite_tokens: expiry cleanup scans
CREATE INDEX IF NOT EXISTS idx_invite_tokens_expires
  ON public.invite_tokens(expires_at)
  WHERE used_by IS NULL;

-- content_plans: calendar date range queries
CREATE INDEX IF NOT EXISTS idx_content_plans_date
  ON public.content_plans(date);

-- profiles: status filter (admin workspace page)
CREATE INDEX IF NOT EXISTS idx_profiles_status
  ON public.profiles(status)
  WHERE role = 'freelancer';

-- ----------------------------------------------------------------
-- PART 3 — REFRESH QUERY PLANNER STATISTICS
-- ----------------------------------------------------------------

ANALYZE public.tasks;
ANALYZE public.task_assignments;
ANALYZE public.notifications;
ANALYZE public.invite_tokens;
ANALYZE public.projects;
ANALYZE public.profiles;
ANALYZE public.task_references;
ANALYZE public.content_plans;
ANALYZE public.project_media;

-- ----------------------------------------------------------------
-- PART 4 — RECLAIM DISK SPACE (removes dead row versions)
-- Note: Supabase runs autovacuum automatically, but running manually
-- after a big delete ensures space is reclaimed immediately.
-- ----------------------------------------------------------------

VACUUM public.invite_tokens;
VACUUM public.notifications;
VACUUM public.task_assignments;
VACUUM public.project_media;

-- ----------------------------------------------------------------
-- VERIFICATION — Run these SELECTs to confirm cleanup worked
-- ----------------------------------------------------------------

SELECT 'invite_tokens remaining' AS check, count(*) FROM public.invite_tokens;
SELECT 'used tokens older than 30d' AS check, count(*)
  FROM public.invite_tokens WHERE used_by IS NOT NULL AND used_at < now() - INTERVAL '30 days';

SELECT 'old read notifications remaining' AS check, count(*)
  FROM public.notifications WHERE read = true AND created_at < now() - INTERVAL '60 days';

SELECT 'orphaned task_assignments' AS check, count(*)
  FROM public.task_assignments WHERE task_id NOT IN (SELECT id FROM public.tasks);

SELECT 'removed freelancer rows cleaned' AS check, count(*)
  FROM public.profiles WHERE status = 'removed';
