import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { DateSelector } from '@/components/DateSelector';
import { TransactionCard } from '@/components/TransactionCard';
import { TransactionForm } from '@/components/TransactionForm';
import { useDeleteTransaction, useTransactions } from '@/hooks/useTransactions';
import { useAppStore } from '@/store/useAppStore';
import type { TransactionWithRelations } from '@/types/database';

export default function OperationsScreen() {
  const period = useAppStore((s) => s.selectedMonth);
  const shift = useAppStore((s) => s.shiftSelectedMonth);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, isError, isFetching, refetch } = useTransactions(period);
  const remove = useDeleteTransaction();

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

  return (
    <View className="flex-1 bg-stone-100 px-4 pt-14 dark:bg-zinc-950">
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-stone-900 dark:text-stone-50">Opérations</Text>
        <Pressable
          onPress={() => setShowForm((v) => !v)}
          className="rounded-full bg-stone-900 px-4 py-2 dark:bg-stone-100"
        >
          <Text className="font-semibold text-white dark:text-stone-900">{showForm ? 'Fermer' : '+ Ajouter'}</Text>
        </Pressable>
      </View>

      <DateSelector period={period} onChange={shift} />

      {showForm ? (
        <View className="mb-3">
          <TransactionForm onDone={() => setShowForm(false)} />
        </View>
      ) : null}

      {isLoading ? (
        <ActivityIndicator className="mt-8" />
      ) : isError ? (
        <Text className="mt-8 text-center text-red-700">Impossible de charger les opérations.</Text>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(t) => t.id}
          contentContainerClassName="gap-2 pb-10"
          renderItem={({ item }) => <TransactionCard transaction={item} onLongPress={() => confirmDelete(item)} />}
          ListEmptyComponent={<Text className="mt-8 text-center text-stone-500">Aucune opération ce mois-ci.</Text>}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => { void refetch(); }} />}
        />
      )}
    </View>
  );
}
