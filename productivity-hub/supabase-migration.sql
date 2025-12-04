-- Personal Productivity Hub Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: loans
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  initial_principal DECIMAL(15, 2) NOT NULL,
  current_balance DECIMAL(15, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  start_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: loan_payments
CREATE TABLE loan_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount_paid DECIMAL(15, 2) NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('regular', 'extra', 'adjustment')) NOT NULL,
  notes TEXT,
  balance_after_payment DECIMAL(15, 2) NOT NULL,
  interest_accrued DECIMAL(15, 2) NOT NULL,
  principal_paid DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries on loan_payments
CREATE INDEX idx_loan_payments_loan_id ON loan_payments(loan_id);
CREATE INDEX idx_loan_payments_date ON loan_payments(payment_date DESC);

-- Table: time_entries
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  category TEXT CHECK (category IN ('UK Job', 'Solar App', 'Factory App', 'Personal', 'Uni', 'Gym')) NOT NULL,
  hours DECIMAL(5, 2) NOT NULL,
  effort_points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries on time_entries
CREATE INDEX idx_time_entries_date ON time_entries(date DESC);
CREATE INDEX idx_time_entries_category ON time_entries(category);

-- Table: clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  product_service TEXT,
  contract_value DECIMAL(15, 2),
  payment_frequency TEXT CHECK (payment_frequency IN ('monthly', 'quarterly', 'annual', 'one-time')) NOT NULL DEFAULT 'monthly',
  next_payment_date DATE,
  status TEXT CHECK (status IN ('active', 'inactive', 'pending')) NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries on clients
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_next_payment ON clients(next_payment_date);

-- Table: journal_entries
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_date DATE UNIQUE NOT NULL,
  content TEXT NOT NULL,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5) NOT NULL,
  energy INTEGER CHECK (energy >= 1 AND energy <= 5) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries on journal_entries
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Optional: Disable Row Level Security for single-user app
-- If you want to enable RLS, uncomment and configure policies
-- ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
