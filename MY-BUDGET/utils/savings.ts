/**
 * Nombre de mensualités restantes avant une date cible, mois en cours inclus.
 * Retourne 0 si la date est passée ou si l'on est déjà dans le mois cible après son échéance.
 */
export function monthsUntil(targetIso: string, now: Date = new Date()): number {
  const [ty, tm] = targetIso.split('-').map(Number);
  const months = (ty - now.getFullYear()) * 12 + (tm - (now.getMonth() + 1)) + 1;
  return Math.max(0, months);
}

/** Épargne mensuelle nécessaire pour couvrir le reste à atteindre. */
export function monthlyNeeded(remaining: number, months: number): number {
  if (remaining <= 0 || months <= 0) return 0;
  return Math.ceil((remaining / months) * 100) / 100;
}
