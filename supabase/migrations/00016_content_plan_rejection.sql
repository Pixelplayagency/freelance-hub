-- Add rejection columns to content_plans
ALTER TABLE content_plans
  ADD COLUMN IF NOT EXISTS caption_rejected BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS post_rejected BOOLEAN NOT NULL DEFAULT FALSE;
