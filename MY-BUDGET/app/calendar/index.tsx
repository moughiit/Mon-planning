import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { DateSelector } from '@/components/DateSelector';
import { KPICard } from '@/components/KPICard';
import { TransactionCard } from '@/components/TransactionCard';
import { COLORS } from '@/constants/theme';
import { useTransactions } from '@/hooks/useTransactions';
import { useAppStore } from '@/store/useAppStore';
import { buildMonthGrid, dailyTotals } from '@/utils/calendar';
import { formatFrDate, monthLabel, todayIso } from '@/utils/dates';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function CalendarScreen() {
  const period = useAppStore((s) => s.selectedMonth);
  const shift = useAppStore((s) => s.shiftSelectedMonth);
  const { data, isLoading, isError, refetch, isFetching } = useTransactions(period);
  const [picked, setPicked] = useState<string | null>(null);

  const grid = useMemo(() => buildMonthGrid(period), [period.year, period.month]);
  const totals = useMemo(() => dailyTotals(data ?? []), [data]);

  // Jour affiché : celui choisi s'il est dans le mois, sinon aujourd'hui (si on est dans ce mois) ou le 1er.
  const monthPrefix = `${period.year}-${String(period.month).padStart(2, '0')}-`;
  const today = todayIso();
  const fallback = today.startsWith(monthPrefix) ? today : `${monthPrefix}01`;
  const selected = picked && picked.startsWith(monthPrefix) ? picked : fallback;

  if (isLoading) return <ActivityIndicator className="mt-8" />;

  const dayTotals = totals.get(selected) ?? { income: 0, outflow: 0, count: 0 };
  const dayItems = (data ?? []).filter((t) => t.transaction_date === selected);

  return (
    <ScrollView
      className="flex-1 bg-stone-100 dark:bg-zinc-950"
      contentContainerClassName="gap-4 p-4"
      refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => { void refetch(); }} />}
    >
      <DateSelector period={period} onChange={shift} />
      {isError ? <Text className="text-center text-red-700">Impossible de charger le calendrier.</Text> : null}

      <View className="rounded-2xl bg-white p-3 dark:bg-zinc-900">
        <View className="flex-row">
          {WEEKDAYS.map((d, i) => (
            <Text key={i} className="flex-1 text-center text-xs font-medium text-stone-500" style={{ width: '14.2857%' }}>
              {d}
            </Text>
          ))}
        </View>

        <View className="flex-row flex-wrap">
          {grid.map((cell, i) => {
            if (!cell) return <View key={`empty-${i}`} style={{ width: '14.2857%', height: 52 }} />;

            const isSelected = cell.iso === selected;
            const day = totals.get(cell.iso);
            const net = day ? day.income - day.outflow : 0;
            const dotColor = !day ? null : net >= 0 ? COLORS.income : COLORS.expense;

            return (
              <Pressable
                key={cell.iso}
                onPress={() => setPicked(cell.iso)}
                style={{ width: '14.2857%', height: 52 }}
                className="items-center justify-center"
              >
                <View
                  className={`h-9 w-9 items-center justify-center rounded-full ${isSelected ? 'bg-stone-900 dark:bg-stone-100' : ''}`}
                >
                  <Text
                    className={`text-sm ${isSelected ? 'font-bold text-white dark:text-stone-900' : 'text-stone-800 dark:text-stone-100'}`}
                  >
                    {cell.day}
                  </Text>
                </View>
                <View className="mt-0.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dotColor ?? 'transparent' }} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text className="text-lg font-semibold capitalize text-stone-900 dark:text-stone-50">
        {formatFrDate(selected)}
      </Text>

      <View className="flex-row gap-3">
        <KPICard label="Revenus du jour" value={dayTotals.income} color={COLORS.income} />
        <KPICard label="Sorties du jour" value={dayTotals.outflow} color={COLORS.expense} hint="dépenses + remboursements" />
      </View>

      <View className="gap-2">
        {dayItems.length === 0 ? (
          <Text className="text-center text-stone-500">Aucune opération ce jour-là.</Text>
        ) : (
          dayItems.map((t) => <TransactionCard key={t.id} transaction={t} />)
        )}
      </View>

      <Text className="text-xs text-stone-400">
        Point vert : jour positif ; point rouge : sorties supérieures aux revenus. Mois affiché : {monthLabel(period)}.
      </Text>
    </ScrollView>
  );
}
