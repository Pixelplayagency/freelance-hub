-- Change due_date from DATE to TIMESTAMPTZ to support specific deadline times
ALTER TABLE tasks
  ALTER COLUMN due_date TYPE TIMESTAMPTZ
  USING due_date::TIMESTAMPTZ;
