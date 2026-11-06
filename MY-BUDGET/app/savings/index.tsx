import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { KPICard } from '@/components/KPICard';
import { SavingsGoalForm } from '@/components/SavingsGoalForm';
import { SubmitButton } from '@/components/FormParts';
import { COLORS } from '@/constants/theme';
import { listAccountBalances } from '@/services/accounts';
import type { SavingsGoal } from '@/types/database';
import { useArchiveSavingsGoal, useSavingsGoals } from '@/hooks/useSavings';
import { formatFrDate } from '@/utils/dates';
import { formatMoney } from '@/utils/money';
import { monthlyNeeded, monthsUntil } from '@/utils/savings';

export default function SavingsScreen() {
  const goalsQuery = useSavingsGoals();
  const balancesQuery = useQuery({ queryKey: ['account-balances'], queryFn: listAccountBalances });
  const archive = useArchiveSavingsGoal();
  const [showForm, setShowForm] = useState(false);

  if (goalsQuery.isLoading || balancesQuery.isLoading) return <ActivityIndicator className="mt-8" />;

  const balances = balancesQuery.data ?? [];
  const goals = goalsQuery.data ?? [];
  const totalSavings = balances.filter((a) => a.type === 'savings').reduce((sum, a) => sum + a.balance, 0);

  // Progression : solde du compte lié, sinon total des comptes d'épargne.
  const currentOf = (g: SavingsGoal) =>
    g.account_id ? (balances.find((a) => a.account_id === g.account_id)?.balance ?? 0) : totalSavings;
  const reachedCount = goals.filter((g) => currentOf(g) >= g.target_amount).length;

  const confirmArchive = (g: SavingsGoal) => {
    Alert.alert('Archiver « ' + g.name + ' » ?', 'L’objectif disparaît de la liste. Ton épargne n’est pas modifiée.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Archiver',
        style: 'destructive',
        onPress: () =>
          archive.mutate(g.id, {
            onError: (e: Error) => Alert.alert('Archivage impossible', e.message),
          }),
      },
    ]);
  };

  return (
    <ScrollView
      className="flex-1 bg-stone-100 dark:bg-zinc-950"
      contentContainerClassName="gap-4 p-4"
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => {
            void goalsQuery.refetch();
            void balancesQuery.refetch();
          }}
        />
      }
    >
      <KPICard
        label="Épargne (comptes d’épargne)"
        value={totalSavings}
        color={COLORS.savings}
        hint={`${reachedCount}/${goals.length} objectif(s) atteint(s)`}
      />

      <SubmitButton label={showForm ? 'Fermer' : '+ Nouvel objectif'} onPress={() => setShowForm((v) => !v)} />
      {showForm ? <SavingsGoalForm onDone={() => setShowForm(false)} /> : null}

      {goals.length === 0 ? (
        <Text className="text-center text-stone-500">Aucun objectif d’épargne pour l’instant.</Text>
      ) : (
        goals.map((g) => {
          const current = currentOf(g);
          const reached = current >= g.target_amount;
          const remaining = Math.max(0, g.target_amount - current);
          const progress = g.target_amount > 0 ? Math.min(100, (current / g.target_amount) * 100) : 0;
          const months = g.target_date ? monthsUntil(g.target_date) : 0;
          const needed = monthlyNeeded(remaining, months);

          return (
            <View key={g.id} className="gap-3 rounded-2xl bg-white p-4 dark:bg-zinc-900">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="font-semibold text-stone-900 dark:text-stone-50" numberOfLines={1}>
                    {g.name}
                  </Text>
                  <Text className="text-xs text-stone-500">
                    {g.account ? `Compte : ${g.account.name}` : 'Sans compte lié : total des comptes d’épargne'}
                  </Text>
                </View>
                {reached ? (
                  <Text className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">Atteint</Text>
                ) : null}
              </View>

              <View className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800">
                <View className="h-2 rounded-full" style={{ width: `${progress}%`, backgroundColor: COLORS.savings }} />
              </View>

              <View className="flex-row justify-between">
                <Text className="text-stone-600 dark:text-stone-300">
                  {formatMoney(current)} sur {formatMoney(g.target_amount)}
                </Text>
                <Text className="font-semibold text-stone-900 dark:text-stone-50">{Math.round(progress)} %</Text>
              </View>

              {!reached && g.target_date ? (
                <Text className="text-sm text-stone-600 dark:text-stone-300">
                  {months > 0
                    ? `Il reste ${formatMoney(remaining)} · environ ${formatMoney(needed)} / mois jusqu’au ${formatFrDate(g.target_date)}`
                    : `Échéance dépassée (${formatFrDate(g.target_date)}) · reste ${formatMoney(remaining)}`}
                </Text>
              ) : null}

              <Pressable onPress={() => confirmArchive(g)} className="items-center rounded-xl bg-stone-100 py-2 dark:bg-zinc-800">
                <Text className="text-stone-700 dark:text-stone-200">Archiver</Text>
              </Pressable>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
