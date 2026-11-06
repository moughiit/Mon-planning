import { currentUserId, supabase } from './supabase';
import type { NewSavingsGoalInput, SavingsGoal } from '@/types/database';

/** Objectifs non archivés, avec le nom du compte lié s'il existe. */
export async function listSavingsGoals(): Promise<SavingsGoal[]> {
  const { data, error } = await supabase
    .from('savings_goals')
    .select('*, account:accounts(name)')
    .neq('status', 'archived')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SavingsGoal[];
}

export async function createSavingsGoal(input: NewSavingsGoalInput): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase.from('savings_goals').insert({
    user_id: userId,
    name: input.name.trim(),
    target_amount: input.target_amount,
    target_date: input.target_date,
    account_id: input.account_id,
  });
  if (error) throw error;
}

export async function archiveSavingsGoal(id: string): Promise<void> {
  const { error } = await supabase.from('savings_goals').update({ status: 'archived' }).eq('id', id);
  if (error) throw error;
}
