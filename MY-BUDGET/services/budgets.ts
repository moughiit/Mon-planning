import { currentUserId, supabase } from './supabase';
import type { Budget, TransactionWithRelations } from '@/types/database';
import type { YearMonth } from '@/utils/dates';

export async function listBudgets({ year, month }: YearMonth): Promise<Budget[]> {
  const { data, error } = await supabase.from('budgets').select('*').eq('year', year).eq('month', month);
  if (error) throw error;
  return (data ?? []) as Budget[];
}

/** Crée ou met à jour le plafond d'une catégorie pour un mois (clé : user, année, mois, catégorie). */
export async function setBudget({ year, month }: YearMonth, categoryId: string, amount: number): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase.from('budgets').upsert(
    { user_id: userId, year, month, category_id: categoryId, amount },
    { onConflict: 'user_id,year,month,category_id' },
  );
  if (error) throw error;
}

export async function removeBudget(id: string): Promise<void> {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw error;
}

/** Dépenses du mois par catégorie (identifiant de catégorie → montant). Calcul local. */
export function spentByCategory(transactions: TransactionWithRelations[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'expense' || !t.category_id) continue;
    totals.set(t.category_id, (totals.get(t.category_id) ?? 0) + t.amount);
  }
  return totals;
}
