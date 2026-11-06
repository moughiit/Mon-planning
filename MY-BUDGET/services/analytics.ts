import { supabase } from './supabase';
import type { MonthlySummary, TransactionWithRelations } from '@/types/database';
import type { YearMonth } from '@/utils/dates';

/** Totaux du mois, calculés côté base (monthly_summary). */
export async function getMonthlySummary({ year, month }: YearMonth): Promise<MonthlySummary> {
  const { data, error } = await supabase.rpc('monthly_summary', { p_year: year, p_month: month });
  if (error) throw error;
  const row = (data as MonthlySummary[] | null)?.[0];
  return (
    row ?? {
      income: 0,
      expenses: 0,
      savings_transferred: 0,
      debt_repaid: 0,
      debt_interest: 0,
    }
  );
}

export interface CategorySlice {
  name: string;
  value: number;
  color: string | null;
}

/** Montants d'un type d'opération regroupés par catégorie (calcul local sur les opérations chargées). */
export function categoryBreakdown(
  transactions: TransactionWithRelations[],
  type: 'income' | 'expense',
): CategorySlice[] {
  const totals = new Map<string, CategorySlice>();

  for (const t of transactions) {
    if (t.type !== type) continue;
    const name = t.category?.name ?? 'Sans catégorie';
    const current = totals.get(name) ?? { name, value: 0, color: t.category?.color ?? null };
    current.value += t.amount;
    totals.set(name, current);
  }

  return [...totals.values()].sort((a, b) => b.value - a.value);
}
