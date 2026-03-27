-- Solar Intern Features Migration
-- Run this SQL file against your Neon database to enable:
--   1. Solar-specific lead status values
--   2. Call tracking columns on leads
--   3. Indexes for manager view performance

-- ============================================================
-- 1. ADD SOLAR-SPECIFIC STATUSES TO lead_status ENUM
--    Old values (new, contacted, follow_up, qualified, converted, lost)
--    are kept intact for Kuberbook compatibility.
-- ============================================================

ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'not_called';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'no_answer';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'not_interested';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'interested';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'demo_scheduled';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'disqualified';

-- ============================================================
-- 2. ADD CALL-TRACKING & LOCATION COLUMNS TO leads TABLE
-- ============================================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS call_date        DATE,
  ADD COLUMN IF NOT EXISTS call_notes       TEXT,
  ADD COLUMN IF NOT EXISTS attempt_count    INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS district         TEXT,
  ADD COLUMN IF NOT EXISTS state            TEXT,
  ADD COLUMN IF NOT EXISTS installations    INT;

-- ============================================================
-- 3. INDEXES FOR MANAGER VIEW & INTERN FILTER QUERIES
-- ============================================================

-- For manager view: "show all leads where call_date = X"
CREATE INDEX IF NOT EXISTS idx_leads_call_date
  ON leads(call_date)
  WHERE call_date IS NOT NULL;

-- For intern filter + manager view: "show leads for intern X on date Y"
CREATE INDEX IF NOT EXISTS idx_leads_assigned_call
  ON leads(assigned_to, call_date);

-- For status filter in LeadsModule
CREATE INDEX IF NOT EXISTS idx_leads_brand_status
  ON leads(brand, status);

-- ============================================================
-- 4. COMMENT
-- ============================================================

COMMENT ON COLUMN leads.call_date     IS 'Date of the most recent call attempt';
COMMENT ON COLUMN leads.call_notes    IS 'Notes from the most recent call (what was said, interest level, concerns)';
COMMENT ON COLUMN leads.attempt_count IS 'Total number of call attempts; stop at 3 for no_answer leads';
COMMENT ON COLUMN leads.district      IS 'Vendor district (denormalized from vendor_prospects for quick display)';
COMMENT ON COLUMN leads.state         IS 'Vendor state (denormalized from vendor_prospects)';
COMMENT ON COLUMN leads.installations IS 'Number of solar installations vendor has done';

SELECT 'Migration complete: solar intern features added' AS notice;
