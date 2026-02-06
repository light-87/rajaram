-- Migration: Employee Points System, Announcements Board, Customer Assignment Tracker
-- Run this against your Neon PostgreSQL database

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. EMPLOYEE POINTS SYSTEM
-- ============================================

-- Table: employee_points - Tracks points earned per customer conversion
CREATE TABLE IF NOT EXISTS employee_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES profiles(id),
  client_id UUID NOT NULL REFERENCES business_clients(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 1000,
  is_redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, client_id) -- One entry per employee per client
);

-- Table: point_milestones - Company-wide milestones that unlock redemption
CREATE TABLE IF NOT EXISTS point_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_count INTEGER NOT NULL UNIQUE, -- e.g. 100, 500, 1000
  label TEXT NOT NULL, -- e.g. "Bronze", "Silver", "Gold"
  reached_at TIMESTAMP WITH TIME ZONE, -- NULL if not yet reached
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default milestones
INSERT INTO point_milestones (milestone_count, label) VALUES
  (10, 'Starter'),
  (25, 'Bronze'),
  (50, 'Silver'),
  (100, 'Gold'),
  (250, 'Platinum'),
  (500, 'Diamond'),
  (1000, 'Legend')
ON CONFLICT (milestone_count) DO NOTHING;

-- Table: point_redemptions - Track when employees redeem points
CREATE TABLE IF NOT EXISTS point_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES profiles(id),
  points_redeemed INTEGER NOT NULL,
  milestone_id UUID REFERENCES point_milestones(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for points
CREATE INDEX IF NOT EXISTS idx_employee_points_employee ON employee_points(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_points_client ON employee_points(client_id);
CREATE INDEX IF NOT EXISTS idx_point_redemptions_employee ON point_redemptions(employee_id);

-- ============================================
-- 2. ANNOUNCEMENT BOARD
-- ============================================

-- Table: announcements - Company-wide announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  link_url TEXT,
  link_label TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_new();

-- Index
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(is_pinned, created_at DESC);

-- ============================================
-- 3. CUSTOMER ASSIGNMENT TRACKER
-- ============================================

-- Table: customer_assignments - Tracks who is assigned to which customer
-- Prevents duplicate company/customer names
CREATE TABLE IF NOT EXISTS customer_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  assigned_to UUID NOT NULL REFERENCES profiles(id),
  assigned_to_name TEXT,
  brand TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_name, company_name) -- Prevent duplicate customer+company combos
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_customer_assignments_updated_at ON customer_assignments;
CREATE TRIGGER update_customer_assignments_updated_at BEFORE UPDATE ON customer_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_new();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_assignments_assigned ON customer_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_customer_assignments_company ON customer_assignments(company_name);
CREATE INDEX IF NOT EXISTS idx_customer_assignments_status ON customer_assignments(status);

-- ============================================
-- 4. FREE TRIAL SUPPORT FOR BUSINESS CLIENTS
-- ============================================

-- Add free trial columns to business_clients
ALTER TABLE business_clients ADD COLUMN IF NOT EXISTS is_free_trial BOOLEAN DEFAULT false;
ALTER TABLE business_clients ADD COLUMN IF NOT EXISTS trial_months INTEGER;
ALTER TABLE business_clients ADD COLUMN IF NOT EXISTS trial_end_date DATE;
ALTER TABLE business_clients ADD COLUMN IF NOT EXISTS is_trial_converted BOOLEAN DEFAULT false;
ALTER TABLE business_clients ADD COLUMN IF NOT EXISTS trial_converted_at TIMESTAMP WITH TIME ZONE;

-- Index for free trial queries
CREATE INDEX IF NOT EXISTS idx_business_clients_trial ON business_clients(is_free_trial, is_trial_converted);
