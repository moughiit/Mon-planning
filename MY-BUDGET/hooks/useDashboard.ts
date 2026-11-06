import { useQuery } from '@tanstack/react-query';
import { listAccountBalances } from '@/services/accounts';
import { getMonthlySummary } from '@/services/analytics';
import type { YearMonth } from '@/utils/dates';

/** Données de l'accueil : soldes totaux du patrimoine et totaux du mois sélectionné. */
export function useDashboard(period: YearMonth) {
  const balances = useQuery({
    queryKey: ['account-balances'],
    queryFn: listAccountBalances,
  });

  const summary = useQuery({
    queryKey: ['monthly-summary', period.year, period.month],
    queryFn: () => getMonthlySummary(period),
  });

  const totalBalance = (balances.data ?? []).reduce((sum, account) => sum + account.balance, 0);

  return {
    balances,
    summary,
    totalBalance,
    isLoading: balances.isLoading || summary.isLoading,
    isError: balances.isError || summary.isError,
    refetch: () => Promise.all([balances.refetch(), summary.refetch()]),
  };
}
