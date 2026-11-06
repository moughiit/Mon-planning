import { useQueries } from '@tanstack/react-query';
import { getMonthlySummary } from '@/services/analytics';
import type { HistoryPoint } from './useMonthlyHistory';

export interface YearTotals {
  income: number;
  expenses: number;
  savings_transferred: number;
  debt_repaid: number;
  debt_interest: number;
  net: number;
  /** Part des revenus mis de côté (%), null s'il n'y a pas de revenus. */
  savingsRate: number | null;
}

export function sumRows(rows: HistoryPoint[]): YearTotals {
  const sum = (pick: (r: HistoryPoint) => number) => Math.round(rows.reduce((acc, r) => acc + pick(r), 0) * 100) / 100;
  const income = sum((r) => r.income);
  const expenses = sum((r) => r.expenses);
  const savings = sum((r) => r.savings_transferred);
  return {
    income,
    expenses,
    savings_transferred: savings,
    debt_repaid: sum((r) => r.debt_repaid),
    debt_interest: sum((r) => r.debt_interest),
    net: Math.round((income - expenses) * 100) / 100,
    savingsRate: income > 0 ? Math.round((savings / income) * 1000) / 10 : null,
  };
}

/** Totaux des 12 mois d'une année. Réutilise le cache des totaux mensuels (mêmes clés). */
export function useYearReport(year: number) {
  const periods = Array.from({ length: 12 }, (_, i) => ({ year, month: i + 1 }));

  const results = useQueries({
    queries: periods.map((period) => ({
      queryKey: ['monthly-summary', period.year, period.month],
      queryFn: () => getMonthlySummary(period),
    })),
  });

  const rows: HistoryPoint[] | undefined = results.every((r) => r.data)
    ? periods.map((period, i) => ({ period, ...results[i].data! }))
    : undefined;

  return {
    rows,
    totals: rows ? sumRows(rows) : undefined,
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
    refetch: () => Promise.all(results.map((r) => r.refetch())),
  };
}
