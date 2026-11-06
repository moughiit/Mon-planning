import { Alert } from 'react-native';
import type { TransactionWithRelations } from '@/types/database';
import { formatMoney } from '@/utils/money';

/**
 * Menu d'appui long sur une opération : modifier ou supprimer.
 * Les remboursements de dettes passent par l'écran Dettes (ils mettent à jour le capital et le statut).
 */
export function confirmTransactionAction(
  t: TransactionWithRelations,
  handlers: { onEdit: () => void; onDelete: () => void },
) {
  if (t.type === 'debt_payment') {
    return Alert.alert(
      'Remboursement de dette',
      'Ce remboursement se gère depuis l’écran Dettes, car il met à jour le capital restant dû.',
    );
  }

  Alert.alert(t.description, formatMoney(t.amount), [
    { text: 'Modifier', onPress: handlers.onEdit },
    { text: 'Supprimer', style: 'destructive', onPress: handlers.onDelete },
    { text: 'Annuler', style: 'cancel' },
  ]);
}
