import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { IncomeExpenseBars } from '@/components/FinanceChart';
import { COLORS } from '@/constants/theme';
import { useYearReport } from '@/hooks/useReports';
import { currentYearMonth, shortMonthLabel } from '@/utils/dates';
import { formatMoney } from '@/utils/money';

export default function ReportsScreen() {
  const [year, setYear] = useState(currentYearMonth().year);
  const { rows, totals, isLoading, isError, refetch } = useYearReport(year);

  return (
    <ScrollView
      className="flex-1 bg-stone-100 dark:bg-zinc-950"
      contentContainerClassName="gap-4 p-4"
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => { void refetch(); }} />}
    >
      <View className="flex-row items-center justify-between py-2">
        <Pressable
          onPress={() => setYear((y) => y - 1)}
          accessibilityLabel="Année précédente"
          className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-zinc-900"
        >
          <Text className="text-lg text-stone-700 dark:text-stone-200">‹</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-stone-900 dark:text-stone-50">Année {year}</Text>
        <Pressable
          onPress={() => setYear((y) => y + 1)}
          accessibilityLabel="Année suivante"
          className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-zinc-900"
        >
          <Text className="text-lg text-stone-700 dark:text-stone-200">›</Text>
        </Pressable>
      </View>

      {isLoading || !rows || !totals ? (
        isError ? (
          <Text className="text-center text-red-700">Impossible de charger le rapport.</Text>
        ) : (
          <ActivityIndicator className="mt-8" />
        )
      ) : (
        <>
          <Text className="text-sm font-semibold uppercase tracking-wide text-stone-500">Bilan annuel</Text>
          <View className="gap-3">
            <Row label="Revenus" value={formatMoney(totals.income)} color={COLORS.income} />
            <Row label="Dépenses" value={formatMoney(totals.expenses)} color={COLORS.expense} />
            <Row
              label="Solde net"
              value={formatMoney(totals.net)}
              color={totals.net >= 0 ? COLORS.income : COLORS.expense}
            />
            <Row label="Épargne transférée" value={formatMoney(totals.savings_transferred)} color={COLORS.savings} />
            <Row label="Taux d’épargne" value={totals.savingsRate === null ? '—' : `${totals.savingsRate} %`} />
            <Row label="Remboursements de dettes" value={formatMoney(totals.debt_repaid)} color={COLORS.debt} />
            <Row label="dont intérêts" value={formatMoney(totals.debt_interest)} />
          </View>

          <IncomeExpenseBars points={rows} />

          <Text className="text-sm font-semibold uppercase tracking-wide text-stone-500">Détail mensuel</Text>
          <View className="overflow-hidden rounded-2xl bg-white dark:bg-zinc-900">
            <View className="flex-row border-b border-stone-200 px-3 py-2 dark:border-zinc-800">
              <Cell header text="Mois" flex={1.1} />
              <Cell header text="Revenus" flex={1.4} align="right" />
              <Cell header text="Dépenses" flex={1.4} align="right" />
              <Cell header text="Net" flex={1.4} align="right" />
            </View>
            {rows.map((r) => {
              const net = r.income - r.expenses;
              return (
                <View
                  key={r.period.month}
                  className="flex-row border-b border-stone-100 px-3 py-2 dark:border-zinc-800"
                >
                  <Cell text={shortMonthLabel(r.period)} flex={1.1} />
                  <Cell text={formatMoney(r.income)} flex={1.4} align="right" />
                  <Cell text={formatMoney(r.expenses)} flex={1.4} align="right" />
                  <Cell
                    text={`${net >= 0 ? '+' : ''}${formatMoney(net)}`}
                    flex={1.4}
                    align="right"
                    color={net >= 0 ? COLORS.income : COLORS.expense}
                  />
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-3 dark:bg-zinc-900">
      <Text className="text-stone-700 dark:text-stone-200">{label}</Text>
      <Text className="font-bold text-stone-900 dark:text-stone-50" style={color ? { color } : undefined}>
        {value}
      </Text>
    </View>
  );
}

function Cell({
  text,
  header = false,
  flex,
  align = 'left',
  color,
}: {
  text?: string;
  header?: boolean;
  flex: number;
  align?: 'left' | 'right';
  color?: string;
}) {
  return (
    <Text
      numberOfLines={1}
      style={{ flex, textAlign: align, color }}
      className={header ? 'text-xs font-semibold text-stone-500' : 'text-xs text-stone-800 dark:text-stone-100'}
    >
      {text ?? ''}
    </Text>
  );
}
