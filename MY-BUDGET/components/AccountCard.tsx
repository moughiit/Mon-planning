import { Text, View } from 'react-native';
import { ACCOUNT_TYPE_LABELS } from '@/constants/labels';
import type { AccountBalance } from '@/types/database';
import { formatMoney } from '@/utils/money';

export function AccountCard({ account }: { account: AccountBalance }) {
  return (
    <View className="min-w-[150px] rounded-2xl bg-white p-4 dark:bg-zinc-900">
      <Text className="text-sm font-semibold text-stone-900 dark:text-stone-50" numberOfLines={1}>
        {account.name}
      </Text>
      <Text className="text-xs text-stone-500 dark:text-stone-400">{ACCOUNT_TYPE_LABELS[account.type]}</Text>
      <Text className="mt-3 text-base font-bold text-stone-900 dark:text-stone-50">
        {formatMoney(account.balance, account.currency)}
      </Text>
    </View>
  );
}
