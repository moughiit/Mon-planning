export function formatMoney(value: number | null | undefined, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(value ?? 0);
}

/**
 * Convertit une saisie utilisateur ("12,50", "12.5", " 1 200 ") en montant.
 * Retourne null si la valeur n'est pas un nombre strictement positif.
 */
export function parseAmount(input: string): number | null {
  const value = parseDecimal(input);
  if (value === null || value <= 0) return null;
  return Math.round(value * 100) / 100;
}

/**
 * Comme parseAmount, mais accepte 0 et une saisie vide (valeur 0).
 * Sert pour les intérêts et les taux. Retourne null si la saisie est invalide ou négative.
 */
export function parseNonNegative(input: string): number | null {
  if (input.trim() === '') return 0;
  const value = parseDecimal(input);
  if (value === null || value < 0) return null;
  return Math.round(value * 100) / 100;
}

function parseDecimal(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
