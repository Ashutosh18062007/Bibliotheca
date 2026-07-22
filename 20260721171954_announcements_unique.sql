/*
# Add unique constraint on announcements for idempotent seeding
1. Modified Tables
   - announcements: add UNIQUE constraint on title so ON CONFLICT (title) DO NOTHING works for seed re-runs.
*/
ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_title_unique;
ALTER TABLE announcements ADD CONSTRAINT announcements_title_unique UNIQUE (title);
