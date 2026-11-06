import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { IncomeExpenseBars } from '@/components/FinanceChart';
import { useMonthlyHistory } from '@/hooks/useMonthlyHistory';
import { monthLabel } from '@/utils/dates';
import { formatMoney } from '@/utils/money';

export default function HistoryScreen() {
  const { data, isLoading, isError, refetch } = useMonthlyHistory(12);

  return (
    <ScrollView
      className="flex-1 bg-stone-100 dark:bg-zinc-950"
      contentContainerClassName="gap-4 p-4 pt-14"
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => { void refetch(); }} />}
    >
      <Text className="text-2xl font-bold text-stone-900 dark:text-stone-50">Historique</Text>
      <Text className="text-sm text-stone-500">12 derniers mois</Text>

      {isLoading || !data ? (
        <ActivityIndicator className="mt-8" />
      ) : isError ? (
        <Text className="mt-8 text-center text-red-700">Impossible de charger l’historique.</Text>
      ) : (
        <>
          <IncomeExpenseBars points={data} />
          <View className="gap-2">
            {[...data].reverse().map((p) => {
              const net = p.income - p.expenses;
              return (
                <View
                  key={`${p.period.year}-${p.period.month}`}
                  className="rounded-2xl bg-white p-4 dark:bg-zinc-900"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="font-semibold capitalize text-stone-900 dark:text-stone-50">
                      {monthLabel(p.period)}
                    </Text>
                    <Text className={net >= 0 ? 'font-bold text-green-700' : 'font-bold text-red-700'}>
                      {net >= 0 ? '+' : ''}
                      {formatMoney(net)}
                    </Text>
                  </View>
                  <Text className="mt-1 text-xs text-stone-500">
                    Revenus {formatMoney(p.income)} · Dépenses {formatMoney(p.expenses)} · Épargne {formatMoney(p.savings_transferred)}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}
