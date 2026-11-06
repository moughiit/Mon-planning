import { Pressable, Text, View } from 'react-native';
import { COLORS } from '@/constants/theme';
import type { DebtWithProgress } from '@/types/database';
import { formatMoney } from '@/utils/money';
import { formatFrDate } from '@/utils/dates';

interface Props {
  debt: DebtWithProgress;
  paying: boolean;
  onTogglePay: () => void;
  onArchive: () => void;
}

export function DebtCard({ debt, paying, onTogglePay, onArchive }: Props) {
  const settled = debt.remaining <= 0;
  const progress = debt.initial_amount > 0 ? Math.min(100, (debt.principal_paid / debt.initial_amount) * 100) : 0;

  return (
    <View className="gap-3 rounded-2xl bg-white p-4 dark:bg-zinc-900">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="font-semibold text-stone-900 dark:text-stone-50" numberOfLines={1}>
            {debt.name}
          </Text>
          {debt.creditor ? <Text className="text-xs text-stone-500">{debt.creditor}</Text> : null}
        </View>
        {settled ? (
          <Text className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">Soldée</Text>
        ) : (
          <Text className="text-xs text-stone-500">Taux {String(debt.interest_rate).replace('.', ',')} %</Text>
        )}
      </View>

      <View className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800">
        <View className="h-2 rounded-full" style={{ width: `${progress}%`, backgroundColor: COLORS.debt }} />
      </View>

      <View className="flex-row justify-between">
        <Text className="text-stone-600 dark:text-stone-300">Restant dû</Text>
        <Text className="font-bold text-stone-900 dark:text-stone-50">{formatMoney(debt.remaining)}</Text>
      </View>
      <View className="flex-row justify-between">
        <Text className="text-stone-600 dark:text-stone-300">Capital remboursé</Text>
        <Text className="text-stone-700 dark:text-stone-200">{formatMoney(debt.principal_paid)}</Text>
      </View>
      <View className="flex-row justify-between">
        <Text className="text-stone-600 dark:text-stone-300">Intérêts payés</Text>
        <Text className="text-stone-700 dark:text-stone-200">{formatMoney(debt.interest_paid)}</Text>
      </View>

      <Text className="text-xs text-stone-500">
        Initial {formatMoney(debt.initial_amount)} · {debt.payments_count} paiement(s)
        {debt.due_date ? ` · échéance ${formatFrDate(debt.due_date)}` : ''}
      </Text>

      <View className="flex-row gap-2">
        {!settled ? (
          <Pressable onPress={onTogglePay} className="flex-1 items-center rounded-xl bg-stone-900 py-2 dark:bg-stone-100">
            <Text className="font-semibold text-white dark:text-stone-900">{paying ? 'Fermer' : 'Rembourser'}</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onArchive} className="items-center rounded-xl bg-stone-100 px-4 py-2 dark:bg-zinc-800">
          <Text className="text-stone-700 dark:text-stone-200">Archiver</Text>
        </Pressable>
      </View>
    </View>
  );
}
