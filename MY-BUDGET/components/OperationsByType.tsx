import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { CategoryDonut } from './FinanceChart';
import { DateSelector } from './DateSelector';
import { KPICard } from './KPICard';
import { SubmitButton } from './FormParts';
import { TransactionCard } from './TransactionCard';
import { TransactionForm } from './TransactionForm';
import { COLORS } from '@/constants/theme';
import { categoryBreakdown } from '@/services/analytics';
import { useDeleteTransaction, useTransactions } from '@/hooks/useTransactions';
import { useAppStore } from '@/store/useAppStore';
import type { TransactionWithRelations } from '@/types/database';

/** Liste, total et répartition des revenus ou des dépenses du mois sélectionné. */
export function OperationsByType({ type }: { type: 'income' | 'expense' }) {
  const period = useAppStore((s) => s.selectedMonth);
  const shift = useAppStore((s) => s.shiftSelectedMonth);
  const { data, isLoading, isError, isFetching, refetch } = useTransactions(period);
  const remove = useDeleteTransaction();
  const [showForm, setShowForm] = useState(false);

  const isIncome = type === 'income';
  const items = useMemo(() => (data ?? []).filter((t) => t.type === type), [data, type]);
  const total = useMemo(() => items.reduce((sum, t) => sum + t.amount, 0), [items]);
  const slices = useMemo(() => categoryBreakdown(items, type), [items, type]);

  const confirmDelete = (t: TransactionWithRelations) => {
    Alert.alert('Supprimer l’opération ?', `${t.description} — ${t.amount} €`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () =>
          remove.mutate(t.id, {
            onError: (e: Error) => Alert.alert('Suppression impossible', e.message),
          }),
      },
    ]);
  };

  if (isLoading) return <ActivityIndicator className="mt-8" />;

  return (
    <ScrollView
      className="flex-1 bg-stone-100 dark:bg-zinc-950"
      contentContainerClassName="gap-4 p-4"
      refreshControl={
        <RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => { void refetch(); }} />
      }
    >
      <DateSelector period={period} onChange={shift} />

      {isError ? <Text className="text-center text-red-700">Impossible de charger les données.</Text> : null}

      <KPICard
        label={isIncome ? 'Revenus du mois' : 'Dépenses du mois'}
        value={total}
        color={isIncome ? COLORS.income : COLORS.expense}
        hint={`${items.length} opération(s)`}
      />

      <SubmitButton
        label={showForm ? 'Fermer' : isIncome ? '+ Ajouter un revenu' : '+ Ajouter une dépense'}
        onPress={() => setShowForm((v) => !v)}
      />
      {showForm ? <TransactionForm fixedType={type} onDone={() => setShowForm(false)} /> : null}

      {slices.length > 0 ? <CategoryDonut slices={slices} label={isIncome ? 'Revenus' : 'Dépenses'} /> : null}

      <Text className="text-lg font-semibold text-stone-900 dark:text-stone-50">Détail</Text>
      <View className="gap-2">
        {items.length === 0 ? (
          <Text className="text-center text-stone-500">Aucune opération ce mois-ci.</Text>
        ) : (
          items.map((t) => <TransactionCard key={t.id} transaction={t} onLongPress={() => confirmDelete(t)} />)
        )}
      </View>
    </ScrollView>
  );
}
