import { Pressable, Text, View } from 'react-native';
import { TRANSACTION_TYPE_LABELS } from '@/constants/labels';
import { COLORS } from '@/constants/theme';
import type { TransactionWithRelations } from '@/types/database';
import { formatMoney } from '@/utils/money';

interface Props {
  transaction: TransactionWithRelations;
  onLongPress?: () => void;
}

export function TransactionCard({ transaction: t, onLongPress }: Props) {
  const sign = t.type === 'income' ? '+' : t.type === 'transfer' ? '' : '−';
  const amountColor = t.type === 'income' ? COLORS.income : t.type === 'transfer' ? COLORS.savings : COLORS.expense;

  const subtitle = [
    t.category?.name ?? TRANSACTION_TYPE_LABELS[t.type],
    t.type === 'transfer' ? `${t.source?.name ?? '?'} → ${t.destination?.name ?? '?'}` : t.source?.name,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={400}
      accessibilityHint="Appui long pour supprimer"
      className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-zinc-900"
    >
      <View className="mr-3 flex-1">
        <Text className="font-semibold text-stone-900 dark:text-stone-50" numberOfLines={1}>
          {t.description}
        </Text>
        <Text className="mt-0.5 text-xs text-stone-500 dark:text-stone-400" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Text className="font-bold" style={{ color: amountColor }}>
        {sign}
        {formatMoney(t.amount)}
      </Text>
    </Pressable>
  );
}
