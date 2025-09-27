export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  invited_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Contribution {
  id: string;
  user_id: string;
  amount: number;
  date: string;
  notes?: string;
  tags?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Expense {
  id: string;
  amount: number;
  purpose: string;
  description?: string;
  date: string;
  category?: string;
  event?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  created_by_user?: User;
}

export interface Invitation {
  id: string;
  email: string;
  token: string;
  invited_by: string;
  used: boolean;
  expires_at: string;
  created_at: string;
}

export interface BudgetSummary {
  total_contributions: number;
  total_expenses: number;
  remaining_balance: number;
  contribution_count: number;
  expense_count: number;
}