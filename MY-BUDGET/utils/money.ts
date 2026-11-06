export function formatMoney(value: number | null | undefined, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(value ?? 0);
}

/**
 * Convertit une saisie utilisateur ("12,50", "12.5", " 1 200 ") en montant.
 * Retourne null si la valeur n'est pas un nombre strictement positif.
 */
export function parseAmount(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, '').replace(',', '.');
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}
