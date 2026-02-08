export interface Loan {
  id: string;
  name: string;
  initial_principal: number;
  current_balance: number;
  interest_rate: number;
  start_date: string;
  created_at: string;
  updated_at: string;
}

export interface LoanPayment {
  id: string;
  loan_id: string;
  payment_date: string;
  amount_paid: number;
  payment_type: "regular" | "extra" | "adjustment";
  notes?: string;
  balance_after_payment: number;
  interest_accrued: number;
  principal_paid: number;
  created_at: string;
}

// --- Personal Finance Types ---

export type IncomeSource = "Salary" | "Dividend" | "Freelance" | "Other";

export interface PersonalIncome {
  id: string;
  amount: number;
  date: string;
  source: IncomeSource;
  notes?: string;
  created_at: string;
}

export type RecurringFrequency = "weekly" | "monthly" | "quarterly" | "yearly";
export type RecurringCategory = "Subscription" | "Loan EMI" | "Insurance" | "Rent" | "Utilities" | "Education" | "Other";

export interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  frequency: RecurringFrequency;
  category: RecurringCategory;
  next_due_date?: string;
  is_active: boolean;
  auto_renew: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ExpenseCategory = "Food" | "Transport" | "Shopping" | "Entertainment" | "Health" | "Education" | "Subscription" | "Loan Payment" | "Utilities" | "Misc";

export interface PersonalExpense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  date: string;
  source?: string;
  source_id?: string;
  created_at: string;
}

export type ClientStatus = "active" | "inactive" | "pending";
export type PaymentFrequency = "monthly" | "quarterly" | "annual" | "one-time";

export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  product_service?: string;
  setup_fee?: number;
  contract_value?: number;
  payment_frequency: PaymentFrequency;
  next_payment_date?: string;
  status: ClientStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  entry_date: string;
  content: string;
  mood: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  created_at: string;
  updated_at: string;
}

export type TodoPriority = "low" | "medium" | "high";

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: TodoPriority;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export type NoteCategoryColor = "purple" | "sky" | "pink" | "yellow" | "green" | "coral";

export interface NoteCategory {
  id: string;
  name: string;
  color: NoteCategoryColor;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  category_id: string | null;
  title: string;
  content: string | null;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

// --- Employee Tools & Business Management ---

export type UserRole = 'admin' | 'employee';
export type ProductBrand = 'Kuberbook' | 'Solar Vendor';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';
export type FollowUpType = 'call' | 'email' | 'meeting' | 'visit' | 'whatsapp';
export type FollowUpStatus = 'pending' | 'completed' | 'cancelled' | 'rescheduled';
export type CommunicationType = 'call' | 'email' | 'meeting' | 'whatsapp' | 'visit' | 'sms';
export type CommunicationOutcome = 'positive' | 'neutral' | 'negative' | 'no_response' | 'callback_requested';
export type PaymentType = 'setup' | 'recurring' | 'one-time' | 'refund';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'card';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type NotificationType = 'lead_assigned' | 'follow_up_due' | 'payment_received' | 'lead_converted' | 'system';

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  brand: ProductBrand;
  customer_name: string;
  phone?: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status: LeadStatus;
  priority?: LeadPriority;
  assigned_to?: string;
  created_by?: string;
  notes?: string;
  google_maps_link?: string;
  next_follow_up?: string;
  follow_up_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessClient {
  id: string;
  brand: ProductBrand;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  contract_value?: number;
  setup_profit?: number;
  recurring_profit?: number;
  agent_name?: string;
  agent_incentive?: number;
  payment_frequency: string;
  status: string;
  created_by?: string;
  google_maps_link?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  next_payment_due?: string;
  payment_status?: 'current' | 'due' | 'overdue';
  is_free_trial?: boolean;
  trial_months?: number;
  trial_end_date?: string;
  is_trial_converted?: boolean;
  trial_converted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyExpense {
  id: string;
  name: string;
  amount: number;
  frequency: 'one-time' | 'monthly' | 'quarterly' | 'annual';
  category?: string;
  next_payment_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  employee_id?: string;
  action: string;
  performed_by?: string;
  details?: string;
  created_at: string;
}

export interface SalesAgent {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  default_incentive?: number;
  created_at: string;
  updated_at: string;
}

// --- New Feature Types ---

export interface FollowUp {
  id: string;
  lead_id?: string;
  client_id?: string;
  scheduled_date: string;
  scheduled_time?: string;
  type: FollowUpType;
  notes?: string;
  status: FollowUpStatus;
  assigned_to?: string;
  completed_at?: string;
  completed_notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  lead_name?: string;
  client_name?: string;
  assigned_to_name?: string;
}

export interface CommunicationLog {
  id: string;
  lead_id?: string;
  client_id?: string;
  type: CommunicationType;
  direction: 'inbound' | 'outbound';
  subject?: string;
  notes?: string;
  duration_minutes?: number;
  outcome?: CommunicationOutcome;
  logged_by?: string;
  logged_at: string;
  created_at: string;
  // Joined fields
  logged_by_name?: string;
}

export interface Payment {
  id: string;
  client_id: string;
  amount: number;
  payment_date: string;
  payment_type: PaymentType;
  payment_method?: PaymentMethod;
  reference_number?: string;
  notes?: string;
  status: PaymentStatus;
  recorded_by?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  client_name?: string;
  recorded_by_name?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  is_read: boolean;
  related_id?: string;
  created_at: string;
}

export interface SalesTarget {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  target_leads: number;
  target_conversions: number;
  target_revenue: number;
  brand?: ProductBrand;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  employee_name?: string;
}

// --- Employee Points System ---

export interface EmployeePoints {
  id: string;
  employee_id: string;
  client_id: string;
  points: number;
  is_redeemed: boolean;
  redeemed_at?: string;
  created_at: string;
  // Joined fields
  employee_name?: string;
  client_name?: string;
}

export interface PointMilestone {
  id: string;
  milestone_count: number;
  label: string;
  reached_at?: string;
  created_at: string;
}

export interface PointRedemption {
  id: string;
  employee_id: string;
  points_redeemed: number;
  milestone_id?: string;
  notes?: string;
  created_at: string;
  // Joined fields
  employee_name?: string;
  milestone_label?: string;
}

// --- Announcements ---

export interface Announcement {
  id: string;
  title: string;
  content: string;
  link_url?: string;
  link_label?: string;
  is_pinned: boolean;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// --- Customer Assignment Tracker ---

export type AssignmentStatus = 'active' | 'completed' | 'on_hold';

export interface CustomerAssignment {
  id: string;
  customer_name: string;
  company_name: string;
  assigned_to: string;
  assigned_to_name?: string;
  brand?: string;
  status: AssignmentStatus;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Dashboard Summary Types
export interface DashboardStats {
  totalLeads: number;
  newLeadsToday: number;
  totalClients: number;
  totalARR: number;
  totalMRR: number;
  pendingFollowUps: number;
  overdueFollowUps: number;
  leadsThisMonth: number;
  conversionsThisMonth: number;
}
