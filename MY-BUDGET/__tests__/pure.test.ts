// Tests unitaires des fonctions pures (sans réseau ni Supabase).
import { formatFrDate, monthBounds, shiftMonth } from '@/utils/dates';
import { parseAmount, parseNonNegative } from '@/utils/money';
import { buildMonthGrid, dailyTotals } from '@/utils/calendar';
import { monthlyNeeded, monthsUntil } from '@/utils/savings';

describe('montants', () => {
  it('parseAmount accepte la virgule, les espaces et arrondit au centime', () => {
    expect(parseAmount('12,50')).toBe(12.5);
    expect(parseAmount(' 1 200 ')).toBe(1200);
    expect(parseAmount('3,256')).toBe(3.26);
  });

  it('parseAmount refuse zéro, négatif et texte', () => {
    expect(parseAmount('0')).toBeNull();
    expect(parseAmount('-3')).toBeNull();
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
  });

  it('parseNonNegative accepte zéro et une saisie vide (valeur 0)', () => {
    expect(parseNonNegative('')).toBe(0);
    expect(parseNonNegative('0')).toBe(0);
    expect(parseNonNegative('-1')).toBeNull();
    expect(parseNonNegative('x')).toBeNull();
  });
});

describe('dates', () => {
  it('formatFrDate passe de AAAA-MM-JJ à JJ/MM/AAAA', () => {
    expect(formatFrDate('2026-03-09')).toBe('09/03/2026');
  });

  it('monthBounds donne le premier et le dernier jour, y compris février', () => {
    expect(monthBounds({ year: 2026, month: 2 })).toEqual({ start: '2026-02-01', end: '2026-02-28' });
    expect(monthBounds({ year: 2028, month: 2 })).toEqual({ start: '2028-02-01', end: '2028-02-29' });
  });

  it('shiftMonth passe correctement d’une année à l’autre', () => {
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
  });
});

describe('calendrier', () => {
  it('novembre 2026 commence un dimanche : 6 cases vides avant le 1er (semaine du lundi)', () => {
    const grid = buildMonthGrid({ year: 2026, month: 11 });
    expect(grid.length % 7).toBe(0);
    expect(grid.slice(0, 6).every((c) => c === null)).toBe(true);
    expect(grid[6]?.iso).toBe('2026-11-01');
    expect(grid.filter(Boolean)).toHaveLength(30);
  });

  it('février 2026 compte 28 jours', () => {
    expect(buildMonthGrid({ year: 2026, month: 2 }).filter(Boolean)).toHaveLength(28);
  });

  it('dailyTotals sépare revenus et sorties, et ignore les virements dans les montants', () => {
    const totals = dailyTotals([
      { type: 'income', amount: 100, transaction_date: '2026-11-02' },
      { type: 'expense', amount: 30, transaction_date: '2026-11-02' },
      { type: 'debt_payment', amount: 20, transaction_date: '2026-11-02' },
      { type: 'transfer', amount: 50, transaction_date: '2026-11-02' },
    ]);
    expect(totals.get('2026-11-02')).toEqual({ income: 100, outflow: 50, count: 4 });
  });
});

describe('épargne', () => {
  const now = new Date(2026, 10, 6); // 6 novembre 2026

  it('monthsUntil compte le mois en cours inclus', () => {
    expect(monthsUntil('2026-11-30', now)).toBe(1);
    expect(monthsUntil('2026-12-15', now)).toBe(2);
    expect(monthsUntil('2027-11-01', now)).toBe(13);
  });

  it('monthsUntil vaut 0 pour une date passée', () => {
    expect(monthsUntil('2026-10-31', now)).toBe(0);
  });

  it('monthlyNeeded répartit le reste à atteindre, arrondi au centime supérieur', () => {
    expect(monthlyNeeded(1000, 4)).toBe(250);
    expect(monthlyNeeded(100, 3)).toBe(33.34);
    expect(monthlyNeeded(0, 3)).toBe(0);
    expect(monthlyNeeded(500, 0)).toBe(0);
  });
});
