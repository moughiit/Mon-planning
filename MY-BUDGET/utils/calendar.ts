import type { TransactionType } from '@/types/database';
import type { YearMonth } from './dates';

const pad = (n: number) => String(n).padStart(2, '0');

export interface CalendarCell {
  iso: string; // AAAA-MM-JJ
  day: number;
}

/**
 * Grille du mois en semaines de 7 jours, commençant le lundi.
 * Les cases hors du mois sont null.
 */
export function buildMonthGrid({ year, month }: YearMonth): (CalendarCell | null)[] {
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7; // 0 = lundi
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (CalendarCell | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ iso: `${year}-${pad(month)}-${pad(day)}`, day });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export interface DayTotals {
  income: number;
  /** Dépenses + remboursements de dettes (tout ce qui sort du budget courant). */
  outflow: number;
  count: number;
}

interface Dated {
  type: TransactionType;
  amount: number;
  transaction_date: string;
}

export function dailyTotals(transactions: Dated[]): Map<string, DayTotals> {
  const totals = new Map<string, DayTotals>();
  for (const t of transactions) {
    const day = totals.get(t.transaction_date) ?? { income: 0, outflow: 0, count: 0 };
    if (t.type === 'income') day.income += t.amount;
    if (t.type === 'expense' || t.type === 'debt_payment') day.outflow += t.amount;
    day.count += 1;
    totals.set(t.transaction_date, day);
  }
  return totals;
}
