import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useMemo } from 'react';
import { CategoryDonut } from '@/components/FinanceChart';
import { DateSelector } from '@/components/DateSelector';
import { useTransactions } from '@/hooks/useTransactions';
import { expenseBreakdown } from '@/services/analytics';
import { useAppStore } from '@/store/useAppStore';

export default function AnalyticsScreen() {
  const period = useAppStore((s) => s.selectedMonth);
  const shift = useAppStore((s) => s.shiftSelectedMonth);
  const { data, isLoading, isError } = useTransactions(period);

  const slices = useMemo(() => expenseBreakdown(data ?? []), [data]);

  return (
    <ScrollView className="flex-1 bg-stone-100 dark:bg-zinc-950" contentContainerClassName="gap-4 p-4 pt-14">
      <Text className="text-2xl font-bold text-stone-900 dark:text-stone-50">Analyse</Text>
      <DateSelector period={period} onChange={shift} />

      {isLoading ? (
        <ActivityIndicator className="mt-8" />
      ) : isError ? (
        <Text className="mt-8 text-center text-red-700">Impossible de charger les données.</Text>
      ) : slices.length === 0 ? (
        <Text className="mt-8 text-center text-stone-500">Aucune dépense ce mois-ci.</Text>
      ) : (
        <View>
          <CategoryDonut slices={slices} />
        </View>
      )}
    </ScrollView>
  );
}
