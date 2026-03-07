-- ============================================================
-- 00004_functions_triggers.sql
-- ============================================================

-- ---- Auto-create profile on signup ----
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'freelancer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---- Notification: task assigned ----
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL)
     OR (TG_OP = 'UPDATE'
         AND NEW.assigned_to IS NOT NULL
         AND NEW.assigned_to IS DISTINCT FROM OLD.assigned_to)
  THEN
    INSERT INTO public.notifications (user_id, type, task_id, project_id, message)
    VALUES (
      NEW.assigned_to,
      'task_assigned',
      NEW.id,
      NEW.project_id,
      'You have been assigned a new task: ' || NEW.title
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER task_assigned_notification
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_task_assigned();

-- ---- Notification: task updated ----
CREATE OR REPLACE FUNCTION public.notify_task_updated()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.assigned_to IS NOT NULL
     AND (
       NEW.title       IS DISTINCT FROM OLD.title       OR
       NEW.description IS DISTINCT FROM OLD.description OR
       NEW.due_date    IS DISTINCT FROM OLD.due_date
     )
  THEN
    INSERT INTO public.notifications (user_id, type, task_id, project_id, message)
    VALUES (
      NEW.assigned_to,
      'task_updated',
      NEW.id,
      NEW.project_id,
      'Your task has been updated: ' || NEW.title
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER task_updated_notification
  AFTER UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_task_updated();

-- ---- Notification: due soon (called via pg_cron) ----
CREATE OR REPLACE FUNCTION public.notify_due_soon()
RETURNS void AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, task_id, project_id, message)
  SELECT
    t.assigned_to,
    'task_due_soon',
    t.id,
    t.project_id,
    'Task due tomorrow: ' || t.title
  FROM public.tasks t
  WHERE
    t.assigned_to IS NOT NULL
    AND t.status NOT IN ('completed')
    AND t.due_date = CURRENT_DATE + INTERVAL '1 day'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.task_id = t.id
        AND n.type = 'task_due_soon'
        AND n.created_at::date = CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- To schedule (run in Supabase SQL Editor after enabling pg_cron extension):
-- SELECT cron.schedule('notify-due-soon', '0 8 * * *', 'SELECT public.notify_due_soon()');

-- ---- updated_at timestamps ----
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
