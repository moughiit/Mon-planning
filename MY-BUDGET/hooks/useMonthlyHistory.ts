import { useQueries } from '@tanstack/react-query';
import { getMonthlySummary } from '@/services/analytics';
import type { MonthlySummary } from '@/types/database';
import { currentYearMonth, shiftMonth, type YearMonth } from '@/utils/dates';

export interface HistoryPoint extends MonthlySummary {
  period: YearMonth;
}

/** Totaux des N derniers mois (le mois courant inclus), du plus ancien au plus récent. */
export function useMonthlyHistory(count = 12) {
  const now = currentYearMonth();
  const periods = Array.from({ length: count }, (_, i) => shiftMonth(now, i - (count - 1)));

  const results = useQueries({
    queries: periods.map((period) => ({
      queryKey: ['monthly-summary', period.year, period.month],
      queryFn: () => getMonthlySummary(period),
    })),
  });

  const data: HistoryPoint[] | undefined = results.every((r) => r.data)
    ? periods.map((period, i) => ({ period, ...results[i].data! }))
    : undefined;

  return {
    data,
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
    refetch: () => Promise.all(results.map((r) => r.refetch())),
  };
}
