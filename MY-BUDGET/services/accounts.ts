import { currentUserId, supabase } from './supabase';
import type { AccountBalance, NewAccountInput } from '@/types/database';

/** Soldes calculés côté base (database/functions/finance_functions.sql). */
export async function listAccountBalances(): Promise<AccountBalance[]> {
  const { data, error } = await supabase.rpc('account_balances');
  if (error) throw error;
  return (data ?? []) as AccountBalance[];
}

export async function createAccount(input: NewAccountInput): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase.from('accounts').insert({
    user_id: userId,
    name: input.name.trim(),
    type: input.type,
    opening_balance: input.opening_balance,
  });
  if (error) throw error;
}
