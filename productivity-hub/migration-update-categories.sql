-- Migration to update time entry categories
-- Run this in your Neon SQL Editor to update the existing database

-- Drop the old constraint
ALTER TABLE time_entries
  DROP CONSTRAINT IF EXISTS time_entries_category_check;

-- Add new constraint with updated categories
ALTER TABLE time_entries
  ADD CONSTRAINT time_entries_category_check
  CHECK (category IN ('Apply Jobs', 'Thesis Work', 'Uni Study', 'Gym', 'Personal work', 'CEO work'));

-- This will allow the new category names
-- Note: Existing entries with old category names will need to be manually updated
-- or you can run UPDATE statements to migrate them:

-- Example migration (uncomment and adjust if needed):
-- UPDATE time_entries SET category = 'Apply Jobs' WHERE category = 'UK Job';
-- UPDATE time_entries SET category = 'Thesis Work' WHERE category = 'Solar App';
-- UPDATE time_entries SET category = 'Uni Study' WHERE category = 'Uni';
-- UPDATE time_entries SET category = 'Personal work' WHERE category = 'Personal';
-- UPDATE time_entries SET category = 'CEO work' WHERE category = 'Factory App';
