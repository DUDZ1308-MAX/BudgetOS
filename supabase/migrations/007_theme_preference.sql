-- Migration 007: Add theme_preference to profiles table
-- Allows users to persist their theme choice across devices
-- Wrapped in DO block: profiles may not exist yet (created in 002)

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'mybudgetos-dark';
    UPDATE profiles SET theme_preference = 'mybudgetos-dark' WHERE theme_preference IS NULL;
    COMMENT ON COLUMN profiles.theme_preference IS 'User preferred theme ID (mybudgetos-dark, midnight-blue, forest, slate, light)';
  END IF;
END $$;
