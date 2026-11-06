import { currentUserId, supabase } from './supabase';
import type { NewTransactionInput, TransactionWithRelations } from '@/types/database';
import { monthBounds, type YearMonth } from '@/utils/dates';

// Les noms de contraintes FK sont définis dans database/migrations/0001_schema.sql
const SELECT_WITH_RELATIONS = `
  *,
  category:categories(name, color),
  source:accounts!transactions_source_account_fk(name),
  destination:accounts!transactions_destination_account_fk(name)
`;

export async function listTransactionsForMonth(period: YearMonth): Promise<TransactionWithRelations[]> {
  const { start, end } = monthBounds(period);
  const { data, error } = await supabase
    .from('transactions')
    .select(SELECT_WITH_RELATIONS)
    .gte('transaction_date', start)
    .lte('transaction_date', end)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as TransactionWithRelations[];
}

/** Champs écrits en base à partir de la saisie (un virement n'a ni catégorie ni compte crédité implicite). */
function toRow(input: NewTransactionInput) {
  const isTransfer = input.type === 'transfer';
  return {
    type: input.type,
    description: input.description.trim(),
    amount: input.amount,
    transaction_date: input.transaction_date,
    category_id: isTransfer ? null : input.category_id,
    source_account_id: input.source_account_id,
    destination_account_id: isTransfer ? input.destination_account_id : null,
    notes: input.notes ?? null,
  };
}

export async function createTransaction(input: NewTransactionInput): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase.from('transactions').insert({ user_id: userId, ...toRow(input) });
  if (error) throw error;
}

export async function updateTransaction(id: string, input: NewTransactionInput): Promise<void> {
  const { error } = await supabase.from('transactions').update(toRow(input)).eq('id', id);
  if (error) throw error;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}
