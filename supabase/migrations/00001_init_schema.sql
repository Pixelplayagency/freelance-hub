-- ============================================================
-- 00001_init_schema.sql
-- Run in Supabase Dashboard > SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------
-- PROFILES — extends auth.users, auto-created via trigger
-- ----------------------------------------------------------------
CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  full_name    TEXT,
  avatar_url   TEXT,
  role         TEXT NOT NULL DEFAULT 'freelancer'
                 CHECK (role IN ('admin', 'freelancer')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- PROJECTS
-- ----------------------------------------------------------------
CREATE TABLE public.projects (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  description  TEXT,
  color        TEXT DEFAULT '#6366f1',
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'archived')),
  created_by   UUID NOT NULL REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- TASKS
-- ----------------------------------------------------------------
CREATE TABLE public.tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'todo'
                    CHECK (status IN ('todo', 'in_progress', 'review', 'completed')),
  assigned_to     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date        DATE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_by      UUID NOT NULL REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX tasks_project_id_idx ON public.tasks(project_id);
CREATE INDEX tasks_assigned_to_idx ON public.tasks(assigned_to);
CREATE INDEX tasks_status_idx ON public.tasks(status);

-- ----------------------------------------------------------------
-- TASK REFERENCES — polymorphic: image | link | video | note
-- ----------------------------------------------------------------
CREATE TABLE public.task_references (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id      UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  type         TEXT NOT NULL
                 CHECK (type IN ('image', 'link', 'video', 'note')),
  storage_path TEXT,
  url          TEXT,
  content      TEXT,
  title        TEXT,
  created_by   UUID NOT NULL REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX task_references_task_id_idx ON public.task_references(task_id);

-- ----------------------------------------------------------------
-- NOTIFICATIONS
-- ----------------------------------------------------------------
CREATE TABLE public.notifications (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL
                 CHECK (type IN ('task_assigned', 'task_updated', 'task_due_soon')),
  task_id      UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  project_id   UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  message      TEXT NOT NULL,
  read         BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX notifications_unread_idx  ON public.notifications(user_id, read);
