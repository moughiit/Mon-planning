import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { DateSelector } from '@/components/DateSelector';
import { confirmTransactionAction } from '@/components/TransactionActions';
import { TransactionCard } from '@/components/TransactionCard';
import { TransactionForm } from '@/components/TransactionForm';
import { useDeleteTransaction, useTransactions } from '@/hooks/useTransactions';
import { useAppStore } from '@/store/useAppStore';
import type { TransactionWithRelations } from '@/types/database';

export default function OperationsScreen() {
  const period = useAppStore((s) => s.selectedMonth);
  const shift = useAppStore((s) => s.shiftSelectedMonth);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TransactionWithRelations | null>(null);

  const { data, isLoading, isError, isFetching, refetch } = useTransactions(period);
  const remove = useDeleteTransaction();

  const formOpen = showForm || editing !== null;
  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  return (
    <View className="flex-1 bg-stone-100 px-4 pt-14 dark:bg-zinc-950">
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-stone-900 dark:text-stone-50">Opérations</Text>
        <Pressable
          onPress={() => (formOpen ? closeForm() : setShowForm(true))}
          className="rounded-full bg-stone-900 px-4 py-2 dark:bg-stone-100"
        >
          <Text className="font-semibold text-white dark:text-stone-900">{formOpen ? 'Fermer' : '+ Ajouter'}</Text>
        </Pressable>
      </View>

      <DateSelector period={period} onChange={shift} />

      {formOpen ? (
        <View className="mb-3">
          <TransactionForm key={editing?.id ?? 'new'} editing={editing ?? undefined} onDone={closeForm} />
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
          renderItem={({ item }) => (
            <TransactionCard
              transaction={item}
              onLongPress={() =>
                confirmTransactionAction(item, {
                  onEdit: () => {
                    setShowForm(false);
                    setEditing(item);
                  },
                  onDelete: () =>
                    remove.mutate(item.id, {
                      onError: (e: Error) => Alert.alert('Suppression impossible', e.message),
                    }),
                })
              }
            />
          )}
          ListEmptyComponent={<Text className="mt-8 text-center text-stone-500">Aucune opération ce mois-ci.</Text>}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => { void refetch(); }} />}
        />
      )}
    </View>
  );
}
