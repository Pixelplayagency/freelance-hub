-- Fix: allow freelancers to insert any reference type (image, video, link, note)
-- for tasks assigned to them. Previously only 'note' was permitted.

-- Drop the old restrictive policy (name may vary — drop both common variants)
DROP POLICY IF EXISTS "freelancers_insert_references" ON task_references;
DROP POLICY IF EXISTS "Freelancers can add notes to their tasks" ON task_references;
DROP POLICY IF EXISTS "freelancers_can_insert_notes" ON task_references;

-- New policy: any authenticated user can insert a reference on a task they are
-- assigned to OR if they are an admin
CREATE POLICY "task_participants_insert_references" ON task_references
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = task_id
        AND (
          tasks.assigned_to = auth.uid()
          OR is_admin()
        )
    )
  );
