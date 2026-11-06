import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { archiveDebt, createDebt, listDebts, recordDebtPayment, type DebtPaymentInput } from '@/services/debts';
import type { NewDebtInput } from '@/types/database';
import { invalidateFinancialData } from './useTransactions';

export function useDebts() {
  return useQuery({ queryKey: ['debts'], queryFn: listDebts });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewDebtInput) => createDebt(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['debts'] }),
  });
}

export function useRecordDebtPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DebtPaymentInput) => recordDebtPayment(input),
    onSuccess: () => invalidateFinancialData(queryClient),
  });
}

export function useArchiveDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveDebt(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['debts'] }),
  });
}
