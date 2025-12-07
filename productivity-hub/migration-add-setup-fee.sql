-- Add setup_fee column to clients table
-- Run this in your Neon SQL Editor

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS setup_fee DECIMAL(15, 2) DEFAULT NULL;

-- Optional: Add comment to clarify the fields
COMMENT ON COLUMN clients.setup_fee IS 'One-time setup/onboarding fee';
COMMENT ON COLUMN clients.contract_value IS 'Recurring payment amount (monthly/quarterly/annual)';
