import { useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { DebtCard } from '@/components/DebtCard';
import { DebtForm } from '@/components/DebtForm';
import { DebtPaymentForm } from '@/components/DebtPaymentForm';
import { KPICard } from '@/components/KPICard';
import { SubmitButton } from '@/components/FormParts';
import { COLORS } from '@/constants/theme';
import { useArchiveDebt, useDebts } from '@/hooks/useDebts';

export default function DebtsScreen() {
  const { data, isLoading, isError, isFetching, refetch } = useDebts();
  const archive = useArchiveDebt();
  const [showForm, setShowForm] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const visible = (data ?? []).filter((d) => d.status !== 'archived');
  const totalRemaining = visible.reduce((sum, d) => sum + d.remaining, 0);
  const totalInterest = visible.reduce((sum, d) => sum + d.interest_paid, 0);

  const confirmArchive = (id: string, name: string) => {
    Alert.alert('Archiver « ' + name + ' » ?', 'La dette disparaît de la liste. Les opérations restent dans l’historique.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Archiver',
        style: 'destructive',
        onPress: () =>
          archive.mutate(id, {
            onSuccess: () => setPayingId((current) => (current === id ? null : current)),
            onError: (e: Error) => Alert.alert('Archivage impossible', e.message),
          }),
      },
    ]);
  };

  if (isLoading) return <ActivityIndicator className="mt-8" />;

  return (
    <ScrollView
      className="flex-1 bg-stone-100 dark:bg-zinc-950"
      contentContainerClassName="gap-4 p-4"
      refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => { void refetch(); }} />}
    >
      {isError ? <Text className="text-center text-red-700">Impossible de charger les dettes.</Text> : null}

      <View className="flex-row gap-3">
        <KPICard label="Restant dû" value={totalRemaining} color={COLORS.debt} hint={`${visible.length} dette(s)`} />
        <KPICard label="Intérêts payés" value={totalInterest} color={COLORS.expense} />
      </View>

      <SubmitButton label={showForm ? 'Fermer' : '+ Nouvelle dette'} onPress={() => setShowForm((v) => !v)} />
      {showForm ? <DebtForm onDone={() => setShowForm(false)} /> : null}

      {visible.length === 0 ? (
        <Text className="text-center text-stone-500">Aucune dette enregistrée.</Text>
      ) : (
        visible.map((debt) => (
          <View key={debt.id} className="gap-2">
            <DebtCard
              debt={debt}
              paying={payingId === debt.id}
              onTogglePay={() => setPayingId((current) => (current === debt.id ? null : debt.id))}
              onArchive={() => confirmArchive(debt.id, debt.name)}
            />
            {payingId === debt.id ? (
              <DebtPaymentForm debt={debt} onDone={() => setPayingId(null)} />
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}
