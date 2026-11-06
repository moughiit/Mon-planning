import type { AccountType, ThemePref, TransactionType } from '@/types/database';

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  income: 'Revenu',
  expense: 'Dépense',
  transfer: 'Virement',
  debt_payment: 'Remboursement',
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Compte courant',
  savings: 'Épargne',
  cash: 'Espèces',
  other: 'Autre',
};

export const THEME_LABELS: Record<ThemePref, string> = {
  system: 'Système',
  light: 'Clair',
  dark: 'Sombre',
};

export const SECONDARY_SCREENS = [
  { label: 'Revenus', route: '/income' },
  { label: 'Dépenses', route: '/expenses' },
  { label: 'Épargne', route: '/savings' },
  { label: 'Dettes', route: '/debts' },
  { label: 'Comptes bancaires', route: '/accounts' },
  { label: 'Budgets et plafonds', route: '/budgets' },
  { label: 'Calendrier quotidien', route: '/calendar' },
  { label: 'Rapports mensuels et annuels', route: '/reports' },
] as const;
