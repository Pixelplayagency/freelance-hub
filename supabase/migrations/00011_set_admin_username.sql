-- ============================================================
-- 00011_set_admin_username.sql
-- Set your admin account's username so you can log in.
-- Replace 'yourusername' with the username you want, then run
-- this in Supabase Dashboard > SQL Editor.
-- ============================================================

UPDATE public.profiles
SET username = 'yourusername'
WHERE role = 'admin' AND username IS NULL;
