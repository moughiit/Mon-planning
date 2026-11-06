import { useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { listAccountBalances } from '@/services/accounts';
import { useCreateSavingsGoal } from '@/hooks/useSavings';
import { todayIso } from '@/utils/dates';
import { parseAmount } from '@/utils/money';
import { Chips, Field, SubmitButton, TextField } from './FormParts';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function SavingsGoalForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
  const accounts = useQuery({ queryKey: ['account-balances'], queryFn: listAccountBalances });
  const create = useCreateSavingsGoal();

  const submit = () => {
    if (!name.trim()) return Alert.alert('Nom requis', 'Donne un nom à l’objectif (ex. Vacances).');
    const target = parseAmount(targetInput);
    if (target === null) return Alert.alert('Montant invalide', 'Le montant cible doit être supérieur à 0.');
    const date = targetDate.trim();
    if (date && (!ISO_DATE.test(date) || date < todayIso())) {
      return Alert.alert('Échéance invalide', 'Format AAAA-MM-JJ, et une date future.');
    }

    create.mutate(
      { name, target_amount: target, target_date: date || null, account_id: accountId },
      {
        onSuccess: () => onDone(),
        onError: (e: Error) => Alert.alert('Enregistrement impossible', e.message),
      },
    );
  };

  return (
    <View className="gap-4 rounded-2xl bg-white p-4 dark:bg-zinc-900">
      <TextField label="Nom" value={name} onChangeText={setName} placeholder="Ex. Vacances" />
      <TextField label="Montant cible (€)" value={targetInput} onChangeText={setTargetInput} keyboardType="decimal-pad" placeholder="0,00" />
      <TextField
        label="Échéance (AAAA-MM-JJ, facultatif)"
        value={targetDate}
        onChangeText={setTargetDate}
        autoCapitalize="none"
        placeholder="—"
      />
      <Field label="Compte lié (facultatif)">
        {accounts.isLoading ? (
          <ActivityIndicator />
        ) : (
          <Chips
            options={(accounts.data ?? []).map((a) => ({ id: a.account_id, label: a.name }))}
            selected={accountId}
            onSelect={setAccountId}
            allowNone
          />
        )}
      </Field>
      <SubmitButton label={create.isPending ? 'Enregistrement…' : 'Créer l’objectif'} onPress={submit} disabled={create.isPending} />
    </View>
  );
}
