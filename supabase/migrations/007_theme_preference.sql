-- Migration 007: Add theme_preference to profiles table
-- Allows users to persist their theme choice across devices

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'mybudgetos-dark';

-- Set default theme for existing users
UPDATE profiles
SET theme_preference = 'mybudgetos-dark'
WHERE theme_preference IS NULL;

COMMENT ON COLUMN profiles.theme_preference IS 'User preferred theme ID (mybudgetos-dark, midnight-blue, forest, slate, light)';
