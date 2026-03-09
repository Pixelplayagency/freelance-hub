ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type TEXT NOT NULL DEFAULT 'standard'
  CHECK (task_type IN ('standard', 'simple'));
