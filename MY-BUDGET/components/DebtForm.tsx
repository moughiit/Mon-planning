import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useCreateDebt } from '@/hooks/useDebts';
import { todayIso } from '@/utils/dates';
import { parseAmount, parseNonNegative } from '@/utils/money';
import { SubmitButton, TextField } from './FormParts';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function DebtForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [creditor, setCreditor] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [rateInput, setRateInput] = useState('0');
  const [startDate, setStartDate] = useState(todayIso());
  const [dueDate, setDueDate] = useState('');
  const create = useCreateDebt();

  const submit = () => {
    if (!name.trim()) return Alert.alert('Nom requis', 'Donne un nom à la dette (ex. Prêt auto).');
    const amount = parseAmount(amountInput);
    if (amount === null) return Alert.alert('Montant invalide', 'Le montant initial doit être supérieur à 0.');
    const rate = parseNonNegative(rateInput);
    if (rate === null || rate > 100) return Alert.alert('Taux invalide', 'Saisis un taux entre 0 et 100.');
    if (!ISO_DATE.test(startDate)) return Alert.alert('Date de début invalide', 'Format attendu : AAAA-MM-JJ');
    const due = dueDate.trim();
    if (due && !ISO_DATE.test(due)) return Alert.alert('Échéance invalide', 'Format attendu : AAAA-MM-JJ');
    if (due && due < startDate) return Alert.alert('Échéance invalide', 'L’échéance doit être après la date de début.');

    create.mutate(
      {
        name,
        creditor: creditor.trim() || null,
        initial_amount: amount,
        interest_rate: rate,
        start_date: startDate,
        due_date: due || null,
      },
      {
        onSuccess: () => onDone(),
        onError: (e: Error) => Alert.alert('Enregistrement impossible', e.message),
      },
    );
  };

  return (
    <View className="gap-4 rounded-2xl bg-white p-4 dark:bg-zinc-900">
      <TextField label="Nom" value={name} onChangeText={setName} placeholder="Ex. Prêt auto" />
      <TextField label="Créancier (facultatif)" value={creditor} onChangeText={setCreditor} placeholder="Ex. Banque X" />
      <TextField label="Montant initial (€)" value={amountInput} onChangeText={setAmountInput} keyboardType="decimal-pad" placeholder="0,00" />
      <TextField label="Taux annuel (%)" value={rateInput} onChangeText={setRateInput} keyboardType="decimal-pad" />
      <TextField label="Date de début (AAAA-MM-JJ)" value={startDate} onChangeText={setStartDate} autoCapitalize="none" />
      <TextField
        label="Échéance (AAAA-MM-JJ, facultatif)"
        value={dueDate}
        onChangeText={setDueDate}
        autoCapitalize="none"
        placeholder="—"
      />
      <SubmitButton label={create.isPending ? 'Enregistrement…' : 'Créer la dette'} onPress={submit} disabled={create.isPending} />
    </View>
  );
}
