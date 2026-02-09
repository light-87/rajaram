-- Personal Finance Tracker Migration
-- Run this in your Neon/Supabase SQL editor

-- Personal income (salary draws from company, etc.)
CREATE TABLE IF NOT EXISTS personal_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  source VARCHAR(100) NOT NULL DEFAULT 'Salary',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_income_date ON personal_income(date DESC);

-- Recurring payments (subscriptions, EMIs, insurance, rent, etc.)
CREATE TABLE IF NOT EXISTS recurring_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  category VARCHAR(50) NOT NULL,
  next_due_date DATE,
  is_active BOOLEAN DEFAULT true,
  auto_renew BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_payments_active ON recurring_payments(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_payments_due ON recurring_payments(next_due_date);

-- Personal expenses (daily spending + auto-created from loan payments)
CREATE TABLE IF NOT EXISTS personal_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(12,2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  source VARCHAR(100) DEFAULT 'manual',
  source_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_expenses_date ON personal_expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_personal_expenses_category ON personal_expenses(category);
CREATE INDEX IF NOT EXISTS idx_personal_expenses_source ON personal_expenses(source, source_id);
