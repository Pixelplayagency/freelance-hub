-- ============================================================
-- 00012_invite_token_role.sql
-- Adds role column to invite_tokens so admin invites can be issued
-- ============================================================

ALTER TABLE public.invite_tokens
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'freelancer'
    CHECK (role IN ('admin', 'freelancer'));
