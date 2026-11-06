// Types écrits à la main à partir de database/migrations.
// Pour les générer automatiquement : `npx supabase gen types typescript --project-id <id>`.

export type ThemePref = 'light' | 'dark' | 'system';
export type AccountType = 'checking' | 'savings' | 'cash' | 'other';
export type CategoryKind = 'income' | 'expense';
export type TransactionType = 'income' | 'expense' | 'transfer' | 'debt_payment';

export interface Profile {
  id: string;
  display_name: string | null;
  currency: string;
  theme: ThemePref;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  currency: string;
  opening_balance: number;
  opening_date: string;
  archived_at: string | null;
}

export interface AccountBalance {
  account_id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  kind: CategoryKind;
  color: string | null;
  icon: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  description: string;
  amount: number;
  transaction_date: string;
  category_id: string | null;
  source_account_id: string | null;
  destination_account_id: string | null;
  debt_id: string | null;
  principal_amount: number | null;
  interest_amount: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Ligne de transactions avec les libellés joints (voir services/transactions.ts). */
export interface TransactionWithRelations extends Transaction {
  category: { name: string; color: string | null } | null;
  source: { name: string } | null;
  destination: { name: string } | null;
}

export interface MonthlySummary {
  income: number;
  expenses: number;
  savings_transferred: number;
  debt_repaid: number;
  debt_interest: number;
}

export interface NewTransactionInput {
  type: 'income' | 'expense' | 'transfer';
  description: string;
  amount: number;
  transaction_date: string;
  category_id: string | null;
  source_account_id: string;
  destination_account_id: string | null;
  notes?: string | null;
}

export type DebtStatus = 'active' | 'repaid' | 'archived';

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  creditor: string | null;
  initial_amount: number;
  interest_rate: number;
  start_date: string;
  due_date: string | null;
  status: DebtStatus;
}

/** Dette avec progression calculée à partir des paiements (services/debts.ts). */
export interface DebtWithProgress extends Debt {
  principal_paid: number;
  interest_paid: number;
  remaining: number;
  payments_count: number;
  last_payment_date: string | null;
}

export interface NewDebtInput {
  name: string;
  creditor: string | null;
  initial_amount: number;
  interest_rate: number;
  start_date: string;
  due_date: string | null;
}

export type SavingsStatus = 'active' | 'reached' | 'archived';

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  target_date: string | null;
  account_id: string | null;
  status: SavingsStatus;
  account: { name: string } | null;
}

export interface NewSavingsGoalInput {
  name: string;
  target_amount: number;
  target_date: string | null;
  account_id: string | null;
}

/** Montant prévu d'une catégorie de dépenses pour un mois donné. */
export interface Budget {
  id: string;
  user_id: string;
  year: number;
  month: number;
  category_id: string | null;
  amount: number;
}

export interface NewAccountInput {
  name: string;
  type: AccountType;
  opening_balance: number;
}
