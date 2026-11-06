import { useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { listAccountBalances } from '@/services/accounts';
import { useRecordDebtPayment } from '@/hooks/useDebts';
import type { DebtWithProgress } from '@/types/database';
import { todayIso } from '@/utils/dates';
import { parseAmount, parseNonNegative, formatMoney } from '@/utils/money';
import { Chips, Field, SubmitButton, TextField } from './FormParts';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Enregistre un remboursement, découpé en capital et intérêts. */
export function DebtPaymentForm({ debt, onDone }: { debt: DebtWithProgress; onDone: () => void }) {
  const [amountInput, setAmountInput] = useState('');
  const [interestInput, setInterestInput] = useState('0');
  const [date, setDate] = useState(todayIso());
  const [sourceId, setSourceId] = useState<string | null>(null);
  const accounts = useQuery({ queryKey: ['account-balances'], queryFn: listAccountBalances });
  const pay = useRecordDebtPayment();

  const amount = parseAmount(amountInput);
  const interest = parseNonNegative(interestInput);
  const principal = amount !== null && interest !== null ? Math.round((amount - interest) * 100) / 100 : null;

  const submit = () => {
    if (amount === null) return Alert.alert('Montant invalide', 'Saisis le montant remboursé.');
    if (interest === null || interest > amount) {
      return Alert.alert('Intérêts invalides', 'Les intérêts doivent être entre 0 et le montant remboursé.');
    }
    if (principal !== null && principal > debt.remaining) {
      return Alert.alert('Montant trop élevé', `Le capital restant dû est de ${formatMoney(debt.remaining)}.`);
    }
    if (!ISO_DATE.test(date)) return Alert.alert('Date invalide', 'Format attendu : AAAA-MM-JJ');
    if (!sourceId) return Alert.alert('Choisis un compte');

    pay.mutate(
      {
        debtId: debt.id,
        debtName: debt.name,
        remainingBefore: debt.remaining,
        amount,
        interest,
        transactionDate: date,
        sourceAccountId: sourceId,
      },
      {
        onSuccess: () => onDone(),
        onError: (e: Error) => Alert.alert('Remboursement impossible', e.message),
      },
    );
  };

  return (
    <View className="gap-4 rounded-2xl bg-stone-50 p-4 dark:bg-zinc-800">
      <TextField label="Montant remboursé (€)" value={amountInput} onChangeText={setAmountInput} keyboardType="decimal-pad" placeholder="0,00" />
      <TextField label="dont intérêts (€)" value={interestInput} onChangeText={setInterestInput} keyboardType="decimal-pad" />
      <TextField label="Date (AAAA-MM-JJ)" value={date} onChangeText={setDate} autoCapitalize="none" />

      {principal !== null ? (
        <Text className="text-sm text-stone-600 dark:text-stone-300">
          Capital : {formatMoney(Math.max(0, principal))} · Restant après paiement : {formatMoney(Math.max(0, debt.remaining - Math.max(0, principal)))}
        </Text>
      ) : null}

      <Field label="Compte débité">
        {accounts.isLoading ? (
          <ActivityIndicator />
        ) : (
          <Chips
            options={(accounts.data ?? []).map((a) => ({ id: a.account_id, label: a.name }))}
            selected={sourceId}
            onSelect={setSourceId}
          />
        )}
      </Field>

      <SubmitButton label={pay.isPending ? 'Enregistrement…' : 'Enregistrer le remboursement'} onPress={submit} disabled={pay.isPending} />
    </View>
  );
}
