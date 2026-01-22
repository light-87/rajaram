-- Tools Bug Fixes Migration for NeonDB
-- Run this SQL file manually to apply database fixes

-- ============================================
-- 1. Update frequency constraint to include 'quarterly'
-- The UI was using 'yearly' but DB expects 'annual'
-- This ensures consistency
-- ============================================

-- First, update any existing 'yearly' values to 'annual'
UPDATE company_expenses
SET frequency = 'annual'
WHERE frequency = 'yearly';

-- The CHECK constraint already allows: 'one-time', 'monthly', 'quarterly', 'annual'
-- No change needed to the constraint

-- ============================================
-- 2. Add index for activity_logs lookup by employee_id
-- ============================================
CREATE INDEX IF NOT EXISTS idx_activity_logs_employee_id ON activity_logs(employee_id);

-- ============================================
-- 3. Add phone and email columns to business_clients if missing
-- (They should exist, but ensuring data integrity)
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'business_clients' AND column_name = 'phone'
    ) THEN
        ALTER TABLE business_clients ADD COLUMN phone TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'business_clients' AND column_name = 'email'
    ) THEN
        ALTER TABLE business_clients ADD COLUMN email TEXT;
    END IF;
END $$;

-- ============================================
-- 4. Create a view for monthly-normalized expenses
-- This helps with accurate profit calculations
-- ============================================
CREATE OR REPLACE VIEW monthly_normalized_expenses AS
SELECT
    id,
    name,
    amount,
    frequency,
    category,
    is_active,
    CASE
        WHEN frequency = 'monthly' THEN amount
        WHEN frequency = 'quarterly' THEN amount / 3
        WHEN frequency = 'annual' THEN amount / 12
        WHEN frequency = 'one-time' THEN 0  -- One-time expenses don't count in monthly
        ELSE amount
    END AS monthly_amount,
    created_at,
    updated_at
FROM company_expenses
WHERE is_active = true;

-- ============================================
-- 5. Add helpful comments to tables
-- ============================================
COMMENT ON COLUMN company_expenses.frequency IS 'Payment frequency: one-time, monthly, quarterly, annual';
COMMENT ON COLUMN activity_logs.employee_id IS 'UUID of the employee who performed the action';
COMMENT ON COLUMN activity_logs.performed_by IS 'Username/name of the person (for display purposes)';

-- ============================================
-- IMPORTANT: Password Migration Notice
-- ============================================
-- After deploying the new bcrypt-based password hashing:
-- 1. All existing password_hash values will be invalid (they use SHA-256)
-- 2. You need to reset all user passwords OR
-- 3. Run a one-time migration script to rehash passwords
--
-- To reset the admin password after migration, run:
-- UPDATE profiles SET password_hash = '<new_bcrypt_hash>' WHERE username = 'your_admin_username';
--
-- Generate a bcrypt hash using: https://bcrypt-generator.com/ or the app's hash function
-- ============================================

SELECT 'Migration complete! Remember to reset user passwords after deploying bcrypt changes.' AS notice;
