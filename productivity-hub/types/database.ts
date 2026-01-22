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

export type TimeCategory = "Apply Jobs" | "Thesis Work" | "Uni Study" | "Gym" | "Personal work" | "CEO work";

export interface TimeEntry {
  id: string;
  date: string;
  category: TimeCategory;
  hours: number;
  effort_points: number;
  description?: string;
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
  assigned_to?: string;
  created_by?: string;
  notes?: string;
  google_maps_link?: string;
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
