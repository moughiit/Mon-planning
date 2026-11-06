import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { AccountCard } from '@/components/AccountCard';
import { DateSelector } from '@/components/DateSelector';
import { KPICard } from '@/components/KPICard';
import { TransactionCard } from '@/components/TransactionCard';
import { COLORS } from '@/constants/theme';
import { useDashboard } from '@/hooks/useDashboard';
import { useTransactions } from '@/hooks/useTransactions';
import { useAppStore } from '@/store/useAppStore';
import { formatMoney } from '@/utils/money';

export default function DashboardScreen() {
  const period = useAppStore((s) => s.selectedMonth);
  const shift = useAppStore((s) => s.shiftSelectedMonth);

  const { balances, summary, totalBalance, isLoading, isError, refetch } = useDashboard(period);
  const transactions = useTransactions(period);
  const recent = (transactions.data ?? []).slice(0, 5);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-stone-100 dark:bg-zinc-950">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-stone-100 dark:bg-zinc-950"
      contentContainerClassName="gap-4 p-4 pt-14"
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => { void refetch(); }} />}
    >
      <Text className="text-2xl font-bold text-stone-900 dark:text-stone-50">Accueil</Text>
      <DateSelector period={period} onChange={shift} />

      {isError ? (
        <Text className="text-center text-red-700">Impossible de charger les données. Tire pour réessayer.</Text>
      ) : null}

      <View className="rounded-2xl bg-stone-900 p-5 dark:bg-stone-100">
        <Text className="text-sm text-stone-300 dark:text-stone-600">Patrimoine total</Text>
        <Text className="mt-1 text-3xl font-bold text-white dark:text-stone-900">
          {formatMoney(totalBalance)}
        </Text>
      </View>

      <View className="flex-row gap-3">
        <KPICard label="Revenus" value={summary.data?.income ?? 0} color={COLORS.income} />
        <KPICard label="Dépenses" value={summary.data?.expenses ?? 0} color={COLORS.expense} />
      </View>
      <View className="flex-row gap-3">
        <KPICard label="Épargne transférée" value={summary.data?.savings_transferred ?? 0} color={COLORS.savings} />
        <KPICard
          label="Remboursement dette"
          value={summary.data?.debt_repaid ?? 0}
          color={COLORS.debt}
          hint={`dont intérêts ${formatMoney(summary.data?.debt_interest ?? 0)}`}
        />
      </View>

      <Text className="mt-2 text-lg font-semibold text-stone-900 dark:text-stone-50">Comptes</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
        {(balances.data ?? []).map((a) => (
          <AccountCard key={a.account_id} account={a} />
        ))}
        <Link href="/accounts" className="min-w-[120px] items-center justify-center rounded-2xl border border-dashed border-stone-400 p-4 text-stone-600">
          + Gérer
        </Link>
      </ScrollView>

      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-stone-900 dark:text-stone-50">Dernières opérations</Text>
        <Link href="/operations" className="text-sm text-stone-600 underline">
          Tout voir
        </Link>
      </View>
      <View className="gap-2">
        {recent.length === 0 ? (
          <Text className="text-stone-500">Aucune opération ce mois-ci.</Text>
        ) : (
          recent.map((t) => <TransactionCard key={t.id} transaction={t} />)
        )}
      </View>
    </ScrollView>
  );
}
