import { currentUserId, supabase } from './supabase';
import type { Debt, DebtWithProgress, NewDebtInput } from '@/types/database';

interface PaymentRow {
  debt_id: string;
  amount: number;
  principal_amount: number | null;
  interest_amount: number | null;
  transaction_date: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Dettes avec leur progression. Le capital remboursé et les intérêts viennent des
 * opérations `debt_payment` (sans découpage, tout le montant est compté comme capital).
 */
export async function listDebts(): Promise<DebtWithProgress[]> {
  const [debtsRes, paymentsRes] = await Promise.all([
    supabase.from('debts').select('*').order('created_at', { ascending: false }),
    supabase
      .from('transactions')
      .select('debt_id, amount, principal_amount, interest_amount, transaction_date')
      .eq('type', 'debt_payment'),
  ]);
  if (debtsRes.error) throw debtsRes.error;
  if (paymentsRes.error) throw paymentsRes.error;

  const payments = (paymentsRes.data ?? []) as PaymentRow[];

  return ((debtsRes.data ?? []) as Debt[]).map((debt) => {
    const mine = payments.filter((p) => p.debt_id === debt.id);
    const principalPaid = round2(mine.reduce((sum, p) => sum + (p.principal_amount ?? p.amount), 0));
    const interestPaid = round2(mine.reduce((sum, p) => sum + (p.interest_amount ?? 0), 0));
    const dates = mine.map((p) => p.transaction_date).sort();

    return {
      ...debt,
      principal_paid: principalPaid,
      interest_paid: interestPaid,
      remaining: Math.max(0, round2(debt.initial_amount - principalPaid)),
      payments_count: mine.length,
      last_payment_date: dates.length > 0 ? dates[dates.length - 1] : null,
    };
  });
}

export async function createDebt(input: NewDebtInput): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase.from('debts').insert({
    user_id: userId,
    name: input.name.trim(),
    creditor: input.creditor?.trim() || null,
    initial_amount: input.initial_amount,
    interest_rate: input.interest_rate,
    start_date: input.start_date,
    due_date: input.due_date,
  });
  if (error) throw error;
}

export interface DebtPaymentInput {
  debtId: string;
  debtName: string;
  remainingBefore: number;
  amount: number;
  interest: number;
  transactionDate: string;
  sourceAccountId: string;
}

export async function recordDebtPayment(input: DebtPaymentInput): Promise<void> {
  if (input.interest < 0 || input.interest > input.amount) {
    throw new Error('Les intérêts doivent être compris entre 0 et le montant remboursé.');
  }
  const principal = round2(input.amount - input.interest);
  if (principal > input.remainingBefore + 0.001) {
    throw new Error(`Le capital remboursé dépasse le restant dû (${input.remainingBefore} €).`);
  }

  const userId = await currentUserId();
  const { error } = await supabase.from('transactions').insert({
    user_id: userId,
    type: 'debt_payment',
    description: `Remboursement — ${input.debtName}`,
    amount: input.amount,
    transaction_date: input.transactionDate,
    source_account_id: input.sourceAccountId,
    destination_account_id: null,
    category_id: null,
    debt_id: input.debtId,
    principal_amount: principal,
    interest_amount: input.interest,
  });
  if (error) throw error;

  // Dette soldée : mise à jour du statut. Ce n'est pas atomique avec l'insertion ci-dessus.
  if (round2(input.remainingBefore - principal) <= 0) {
    const { error: statusError } = await supabase.from('debts').update({ status: 'repaid' }).eq('id', input.debtId);
    if (statusError) {
      throw new Error(`Paiement enregistré, mais le statut « soldée » n'a pas pu être mis à jour : ${statusError.message}`);
    }
  }
}

export async function archiveDebt(id: string): Promise<void> {
  const { error } = await supabase.from('debts').update({ status: 'archived' }).eq('id', id);
  if (error) throw error;
}
