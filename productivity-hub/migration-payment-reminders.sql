-- Payment Reminders System Migration
-- This migration ensures the next_payment_due and contract_start_date columns exist
-- and sets up the recurring payment tracking system

-- Ensure columns exist (they should from previous migrations, but safe to re-run)
ALTER TABLE business_clients ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE business_clients ADD COLUMN IF NOT EXISTS next_payment_due DATE;

-- For any existing active clients that don't have next_payment_due set,
-- calculate it as 1 year from their contract_start_date or created_at
UPDATE business_clients
SET next_payment_due = COALESCE(contract_start_date, created_at::date) + INTERVAL '1 year'
WHERE status = 'active'
  AND next_payment_due IS NULL;

-- For any existing active clients without contract_start_date, set it from created_at
UPDATE business_clients
SET contract_start_date = created_at::date
WHERE contract_start_date IS NULL;
