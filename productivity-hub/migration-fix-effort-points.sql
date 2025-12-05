-- Migration to fix effort_points column type
-- Run this in your Neon SQL Editor to update the existing database

-- Change effort_points from INTEGER to DECIMAL(5, 2)
ALTER TABLE time_entries
  ALTER COLUMN effort_points TYPE DECIMAL(5, 2);

-- This will allow fractional effort points to be stored
-- (e.g., 1.25 effort points for 1.25 hours of work)
