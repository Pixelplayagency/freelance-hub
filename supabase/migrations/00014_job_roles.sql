-- Add job_role column to profiles for freelancer role specialization
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS job_role TEXT
  CHECK (job_role IN ('video_editor','graphic_designer','social_media_manager','creative_strategy_lead'));
