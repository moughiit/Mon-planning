import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { TRANSACTION_TYPE_LABELS } from '@/constants/labels';
import { listAccountBalances } from '@/services/accounts';
import { listCategories } from '@/services/categories';
import { useCreateTransaction } from '@/hooks/useTransactions';
import type { CategoryKind } from '@/types/database';
import { parseAmount } from '@/utils/money';
import { todayIso } from '@/utils/dates';
import { Chips, Field, SubmitButton, TextField } from './FormParts';

type FormType = 'expense' | 'income' | 'transfer';

const TYPE_TO_KIND: Partial<Record<FormType, CategoryKind>> = { expense: 'expense', income: 'income' };

interface Props {
  onDone: () => void;
  /** Si défini, le type est imposé (écrans Revenus / Dépenses) et le choix est masqué. */
  fixedType?: 'income' | 'expense';
}

export function TransactionForm({ onDone, fixedType }: Props) {
  const [type, setType] = useState<FormType>(fixedType ?? 'expense');
  const [amountInput, setAmountInput] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(todayIso());
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [destinationId, setDestinationId] = useState<string | null>(null);

  const kind = TYPE_TO_KIND[type];
  const categories = useQuery({
    queryKey: ['categories', kind ?? 'all'],
    queryFn: () => listCategories(kind),
    enabled: type !== 'transfer',
  });
  const accounts = useQuery({ queryKey: ['account-balances'], queryFn: listAccountBalances });
  const create = useCreateTransaction();

  const visibleCategories = useMemo(() => categories.data ?? [], [categories.data]);
  const accountOptions = (accounts.data ?? []).map((a) => ({ id: a.account_id, label: a.name }));

  const submit = () => {
    const amount = parseAmount(amountInput);
    if (amount === null) return Alert.alert('Montant invalide', 'Saisis un montant supérieur à 0.');
    if (!description.trim()) return Alert.alert('Description requise');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Alert.alert('Date invalide', 'Format attendu : AAAA-MM-JJ');
    if (!sourceId) return Alert.alert('Choisis un compte');
    if (type === 'transfer' && (!destinationId || destinationId === sourceId)) {
      return Alert.alert('Choisis un compte de destination différent');
    }

    create.mutate(
      {
        type,
        description,
        amount,
        transaction_date: date,
        category_id: categoryId,
        source_account_id: sourceId,
        destination_account_id: type === 'transfer' ? destinationId : null,
      },
      {
        onSuccess: () => onDone(),
        onError: (e: Error) => Alert.alert('Enregistrement impossible', e.message),
      },
    );
  };

  return (
    <View className="gap-4 rounded-2xl bg-white p-4 dark:bg-zinc-900">
      {!fixedType ? (
        <Chips
          options={(['expense', 'income', 'transfer'] as FormType[]).map((t) => ({ id: t, label: TRANSACTION_TYPE_LABELS[t] }))}
          selected={type}
          onSelect={(t) => {
            setType(t as FormType);
            setCategoryId(null);
            if (t !== 'transfer') setDestinationId(null);
          }}
        />
      ) : null}

      <TextField label="Montant (€)" value={amountInput} onChangeText={setAmountInput} keyboardType="decimal-pad" placeholder="0,00" />
      <TextField label="Description" value={description} onChangeText={setDescription} placeholder="Ex. Courses, salaire…" />
      <TextField label="Date (AAAA-MM-JJ)" value={date} onChangeText={setDate} autoCapitalize="none" />

      {type !== 'transfer' ? (
        <Field label="Catégorie">
          {categories.isLoading ? (
            <ActivityIndicator />
          ) : (
            <Chips
              options={visibleCategories.map((c) => ({ id: c.id, label: c.name }))}
              selected={categoryId}
              onSelect={setCategoryId}
              allowNone
            />
          )}
        </Field>
      ) : null}

      <Field label={type === 'transfer' ? 'Compte débité' : 'Compte'}>
        <Chips options={accountOptions} selected={sourceId} onSelect={setSourceId} />
      </Field>

      {type === 'transfer' ? (
        <Field label="Compte crédité">
          <Chips options={accountOptions} selected={destinationId} onSelect={setDestinationId} />
        </Field>
      ) : null}

      <SubmitButton label={create.isPending ? 'Enregistrement…' : 'Enregistrer'} onPress={submit} disabled={create.isPending} />
    </View>
  );
}
