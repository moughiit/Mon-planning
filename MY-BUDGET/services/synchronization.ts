import { AppState, type AppStateStatus } from 'react-native';
import type { QueryClient } from '@tanstack/react-query';

/**
 * Rafraîchit les données quand l'app revient au premier plan.
 * Ce n'est PAS une synchronisation hors-ligne : les écritures échouent sans réseau.
 * Une file d'attente hors-ligne reste à concevoir si le besoin apparaît.
 */
export function startForegroundRefresh(queryClient: QueryClient): () => void {
  const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') {
      queryClient.invalidateQueries();
    }
  });
  return () => subscription.remove();
}
