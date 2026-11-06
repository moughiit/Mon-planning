import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTransaction, deleteTransaction, listTransactionsForMonth } from '@/services/transactions';
import type { NewTransactionInput } from '@/types/database';
import type { YearMonth } from '@/utils/dates';

export const transactionsKey = (p: YearMonth) => ['transactions', p.year, p.month] as const;

/** Les écritures impactent soldes, totaux mensuels et historique : on invalide tout ça. */
const FINANCIAL_KEYS = ['transactions', 'monthly-summary', 'account-balances', 'monthly-history'] as const;

export function useTransactions(period: YearMonth) {
  return useQuery({
    queryKey: transactionsKey(period),
    queryFn: () => listTransactionsForMonth(period),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewTransactionInput) => createTransaction(input),
    onSuccess: () => Promise.all(FINANCIAL_KEYS.map((key) => queryClient.invalidateQueries({ queryKey: [key] }))),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => Promise.all(FINANCIAL_KEYS.map((key) => queryClient.invalidateQueries({ queryKey: [key] }))),
  });
}
