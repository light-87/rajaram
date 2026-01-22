-- Employee Tools & Sales Management Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Brand/Product Enum
DO $$ BEGIN
    CREATE TYPE product_brand AS ENUM ('Kuberbook', 'Solar Vendor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Lead Status Enum
DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'lost');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: profiles (Standalone for non-Supabase environments)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- For simple storage (ideally hashed)
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'employee',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand product_brand NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  latitude DECIMAL(9, 6),
  longitude DECIMAL(9, 6),
  status lead_status DEFAULT 'new',
  assigned_to UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  notes TEXT,
  google_maps_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: business_clients
CREATE TABLE IF NOT EXISTS business_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand product_brand NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  latitude DECIMAL(9, 6),
  longitude DECIMAL(9, 6),
  contract_value DECIMAL(15, 2), -- Deprecated: Use calculated values if preferred
  setup_profit DECIMAL(15, 2) DEFAULT 0,
  recurring_profit DECIMAL(15, 2) DEFAULT 0,
  agent_name TEXT,              -- Name of the agent who closed the deal
  agent_incentive DECIMAL(15, 2) DEFAULT 0, -- One-time commission/pay for the agent
  payment_frequency TEXT,
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES profiles(id),
  google_maps_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: company_expenses
CREATE TABLE IF NOT EXISTS company_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  frequency TEXT CHECK (frequency IN ('one-time', 'monthly', 'quarterly', 'annual')) NOT NULL DEFAULT 'monthly',
  category TEXT, -- 'Salary', 'Software', 'Rent', etc.
  next_payment_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: sales_agents
CREATE TABLE IF NOT EXISTS sales_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  phone TEXT,
  email TEXT,
  default_incentive DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  performed_by TEXT, -- Stores username or full name for quick display
  details TEXT,      -- Store details as text
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_brand ON leads(brand);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_business_clients_brand ON business_clients(brand);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column_new()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_new();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_new();

DROP TRIGGER IF EXISTS update_business_clients_updated_at ON business_clients;
CREATE TRIGGER update_business_clients_updated_at BEFORE UPDATE ON business_clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_new();

DROP TRIGGER IF EXISTS update_company_expenses_updated_at ON company_expenses;
CREATE TRIGGER update_company_expenses_updated_at BEFORE UPDATE ON company_expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_new();

-- INITIAL SETUP:
-- Run this SQL next to create your first admin user:
-- INSERT INTO profiles (username, password_hash, full_name, role) 
-- VALUES ('vaibhav', 'your_password_here', 'Vaibhav Kumar', 'admin');
