import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listBudgets, removeBudget, setBudget } from '@/services/budgets';
import type { YearMonth } from '@/utils/dates';

export function useBudgets(period: YearMonth) {
  return useQuery({
    queryKey: ['budgets', period.year, period.month],
    queryFn: () => listBudgets(period),
  });
}

export function useSaveBudget(period: YearMonth) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, amount }: { categoryId: string; amount: number }) =>
      setBudget(period, categoryId, amount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useRemoveBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeBudget(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  });
}
