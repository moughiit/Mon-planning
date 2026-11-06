// Dates au format local, sans passage par UTC (évite le décalage d'un jour avec toISOString()).

const pad = (n: number) => String(n).padStart(2, '0');

export interface YearMonth {
  year: number;
  month: number; // 1 à 12
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function currentYearMonth(): YearMonth {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function shiftMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function monthBounds({ year, month }: YearMonth): { start: string; end: string } {
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${year}-${pad(month)}-01`,
    end: `${year}-${pad(month)}-${pad(lastDay)}`,
  };
}

export function monthLabel({ year, month }: YearMonth): string {
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  );
}

export function shortMonthLabel({ year, month }: YearMonth): string {
  return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(year, month - 1, 1));
}
