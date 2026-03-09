-- ============================================================
-- 00008_add_username.sql
-- Adds username field to profiles for freelancer onboarding
-- Run in Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
