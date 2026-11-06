import { Text, View } from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { COLORS } from '@/constants/theme';
import type { CategorySlice } from '@/services/analytics';
import type { HistoryPoint } from '@/hooks/useMonthlyHistory';
import { shortMonthLabel } from '@/utils/dates';
import { formatMoney } from '@/utils/money';

/** Revenus (vert) et dépenses (rouge) par mois. */
export function IncomeExpenseBars({ points }: { points: HistoryPoint[] }) {
  const data = points.flatMap((p, i) => [
    {
      value: p.income,
      frontColor: COLORS.income,
      label: i % 2 === 0 ? shortMonthLabel(p.period) : '',
      spacing: 4,
    },
    { value: p.expenses, frontColor: COLORS.expense, spacing: 14 },
  ]);

  return (
    <View className="rounded-2xl bg-white p-4 dark:bg-zinc-900">
      <BarChart
        data={data}
        barWidth={10}
        noOfSections={4}
        yAxisTextStyle={{ color: COLORS.muted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: COLORS.muted, fontSize: 10 }}
        rulesColor="#E7E5E4"
        yAxisLabelPrefix="€"
        hideRules={false}
        isAnimated
      />
      <View className="mt-3 flex-row gap-4">
        <Legend color={COLORS.income} label="Revenus" />
        <Legend color={COLORS.expense} label="Dépenses" />
      </View>
    </View>
  );
}

/** Répartition des dépenses par catégorie (anneau). */
export function CategoryDonut({ slices }: { slices: CategorySlice[] }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const data = slices.map((s, i) => ({
    value: s.value,
    color: s.color ?? `hsl(${(i * 47) % 360} 55% 55%)`,
    text: total > 0 ? `${Math.round((s.value / total) * 100)}%` : '',
  }));

  return (
    <View className="items-center rounded-2xl bg-white p-4 dark:bg-zinc-900">
      <PieChart
        data={data}
        donut
        radius={90}
        innerRadius={58}
        innerCircleColor="transparent"
        centerLabelComponent={() => (
          <View className="items-center">
            <Text className="text-xs text-stone-500">Dépenses</Text>
            <Text className="text-sm font-bold text-stone-900 dark:text-stone-50">{formatMoney(total)}</Text>
          </View>
        )}
      />
      <View className="mt-4 w-full gap-2">
        {slices.map((s, i) => (
          <View key={s.name} className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="h-3 w-3 rounded-full" style={{ backgroundColor: data[i].color }} />
              <Text className="text-sm text-stone-700 dark:text-stone-200">{s.name}</Text>
            </View>
            <Text className="text-sm text-stone-500">{formatMoney(s.value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
      <Text className="text-xs text-stone-500">{label}</Text>
    </View>
  );
}
