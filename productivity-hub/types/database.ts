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
