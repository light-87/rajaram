-- Tools Features Migration for NeonDB
-- New tables for enhanced business management features
-- Run this SQL file manually to add new features

-- ============================================
-- 1. FOLLOW-UPS TABLE
-- Track scheduled follow-ups for leads
-- ============================================
CREATE TABLE IF NOT EXISTS follow_ups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    client_id UUID REFERENCES business_clients(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME,
    type VARCHAR(20) NOT NULL DEFAULT 'call', -- 'call', 'email', 'meeting', 'visit', 'whatsapp'
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'cancelled', 'rescheduled'
    assigned_to UUID REFERENCES profiles(id),
    completed_at TIMESTAMPTZ,
    completed_notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT follow_up_target CHECK (lead_id IS NOT NULL OR client_id IS NOT NULL)
);

CREATE INDEX idx_follow_ups_scheduled ON follow_ups(scheduled_date, status);
CREATE INDEX idx_follow_ups_assigned ON follow_ups(assigned_to, status);
CREATE INDEX idx_follow_ups_lead ON follow_ups(lead_id);
CREATE INDEX idx_follow_ups_client ON follow_ups(client_id);

-- ============================================
-- 2. COMMUNICATION LOGS TABLE
-- Track all interactions with leads/clients
-- ============================================
CREATE TABLE IF NOT EXISTS communication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    client_id UUID REFERENCES business_clients(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL, -- 'call', 'email', 'meeting', 'whatsapp', 'visit', 'sms'
    direction VARCHAR(10) DEFAULT 'outbound', -- 'inbound', 'outbound'
    subject TEXT,
    notes TEXT,
    duration_minutes INT, -- For calls/meetings
    outcome VARCHAR(30), -- 'positive', 'neutral', 'negative', 'no_response', 'callback_requested'
    logged_by UUID REFERENCES profiles(id),
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comm_logs_lead ON communication_logs(lead_id);
CREATE INDEX idx_comm_logs_client ON communication_logs(client_id);
CREATE INDEX idx_comm_logs_logged_at ON communication_logs(logged_at DESC);

-- ============================================
-- 3. PAYMENTS TABLE
-- Track actual payments received from clients
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES business_clients(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_type VARCHAR(20) NOT NULL, -- 'setup', 'recurring', 'one-time', 'refund'
    payment_method VARCHAR(20), -- 'cash', 'upi', 'bank_transfer', 'cheque', 'card'
    reference_number TEXT,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'refunded'
    recorded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_client ON payments(client_id);
CREATE INDEX idx_payments_date ON payments(payment_date DESC);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================
-- 4. NOTIFICATIONS TABLE
-- In-app notifications for users
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL, -- 'lead_assigned', 'follow_up_due', 'payment_received', 'lead_converted', 'system'
    link TEXT, -- URL to navigate to when clicked
    is_read BOOLEAN DEFAULT FALSE,
    related_id UUID, -- ID of related entity (lead_id, client_id, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================
-- 5. SALES TARGETS TABLE
-- Monthly/quarterly targets for employees
-- ============================================
CREATE TABLE IF NOT EXISTS sales_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    target_leads INT DEFAULT 0,
    target_conversions INT DEFAULT 0,
    target_revenue DECIMAL(12, 2) DEFAULT 0,
    brand VARCHAR(20), -- NULL for all brands, or 'Kuberbook', 'Solar Vendor'
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_targets_employee ON sales_targets(employee_id, period_start);

-- ============================================
-- 6. ADD FOLLOW-UP FIELDS TO LEADS TABLE
-- ============================================
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS next_follow_up DATE,
ADD COLUMN IF NOT EXISTS follow_up_notes TEXT,
ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium'; -- 'low', 'medium', 'high', 'urgent'

CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(next_follow_up) WHERE next_follow_up IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);

-- ============================================
-- 7. ADD CONTRACT DATES TO CLIENTS
-- ============================================
ALTER TABLE business_clients
ADD COLUMN IF NOT EXISTS contract_start_date DATE,
ADD COLUMN IF NOT EXISTS contract_end_date DATE,
ADD COLUMN IF NOT EXISTS next_payment_due DATE,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'current'; -- 'current', 'due', 'overdue'

-- ============================================
-- 8. HELPER VIEWS
-- ============================================

-- View: Today's follow-ups
CREATE OR REPLACE VIEW todays_follow_ups AS
SELECT
    f.*,
    l.customer_name as lead_name,
    l.phone as lead_phone,
    c.name as client_name,
    c.phone as client_phone,
    p.full_name as assigned_to_name
FROM follow_ups f
LEFT JOIN leads l ON f.lead_id = l.id
LEFT JOIN business_clients c ON f.client_id = c.id
LEFT JOIN profiles p ON f.assigned_to = p.id
WHERE f.scheduled_date = CURRENT_DATE
AND f.status = 'pending'
ORDER BY f.scheduled_time NULLS LAST;

-- View: Overdue follow-ups
CREATE OR REPLACE VIEW overdue_follow_ups AS
SELECT
    f.*,
    l.customer_name as lead_name,
    c.name as client_name,
    p.full_name as assigned_to_name,
    CURRENT_DATE - f.scheduled_date as days_overdue
FROM follow_ups f
LEFT JOIN leads l ON f.lead_id = l.id
LEFT JOIN business_clients c ON f.client_id = c.id
LEFT JOIN profiles p ON f.assigned_to = p.id
WHERE f.scheduled_date < CURRENT_DATE
AND f.status = 'pending'
ORDER BY f.scheduled_date;

-- View: Payment summary by client
CREATE OR REPLACE VIEW client_payment_summary AS
SELECT
    c.id as client_id,
    c.name as client_name,
    c.brand,
    c.recurring_profit as expected_annual,
    COALESCE(SUM(p.amount) FILTER (WHERE p.payment_type = 'setup'), 0) as total_setup_received,
    COALESCE(SUM(p.amount) FILTER (WHERE p.payment_type = 'recurring'), 0) as total_recurring_received,
    COALESCE(SUM(p.amount), 0) as total_received,
    MAX(p.payment_date) as last_payment_date
FROM business_clients c
LEFT JOIN payments p ON c.id = p.client_id AND p.status = 'completed'
GROUP BY c.id, c.name, c.brand, c.recurring_profit;

-- View: Employee performance
CREATE OR REPLACE VIEW employee_performance AS
SELECT
    p.id as employee_id,
    p.full_name,
    COUNT(DISTINCT l.id) FILTER (WHERE l.created_at >= DATE_TRUNC('month', CURRENT_DATE)) as leads_this_month,
    COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'converted' AND l.updated_at >= DATE_TRUNC('month', CURRENT_DATE)) as conversions_this_month,
    COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'completed' AND f.completed_at >= DATE_TRUNC('month', CURRENT_DATE)) as follow_ups_completed
FROM profiles p
LEFT JOIN leads l ON l.assigned_to = p.id OR l.created_by = p.id
LEFT JOIN follow_ups f ON f.assigned_to = p.id
WHERE p.role = 'employee' OR p.role = 'admin'
GROUP BY p.id, p.full_name;

-- ============================================
-- 9. FUNCTIONS
-- ============================================

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title VARCHAR(100),
    p_message TEXT,
    p_type VARCHAR(30),
    p_link TEXT DEFAULT NULL,
    p_related_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, link, related_id)
    VALUES (p_user_id, p_title, p_message, p_type, p_link, p_related_id)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE follow_ups IS 'Scheduled follow-up tasks for leads and clients';
COMMENT ON TABLE communication_logs IS 'History of all communications with leads/clients';
COMMENT ON TABLE payments IS 'Payment records for tracking actual revenue';
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON TABLE sales_targets IS 'Monthly/quarterly sales targets for employees';

SELECT 'Migration complete! New tables created: follow_ups, communication_logs, payments, notifications, sales_targets' AS notice;
