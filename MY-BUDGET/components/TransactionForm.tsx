import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { TRANSACTION_TYPE_LABELS } from '@/constants/labels';
import { listAccountBalances } from '@/services/accounts';
import { listCategories } from '@/services/categories';
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/useTransactions';
import type { CategoryKind, NewTransactionInput, TransactionWithRelations } from '@/types/database';
import { parseAmount } from '@/utils/money';
import { todayIso } from '@/utils/dates';
import { Chips, Field, SubmitButton, TextField } from './FormParts';

type FormType = 'expense' | 'income' | 'transfer';

const TYPE_TO_KIND: Partial<Record<FormType, CategoryKind>> = { expense: 'expense', income: 'income' };

interface Props {
  onDone: () => void;
  /** Si défini, le type est imposé (écrans Revenus / Dépenses) et le choix est masqué. */
  fixedType?: 'income' | 'expense';
  /** Si défini, le formulaire modifie cette opération au lieu d'en créer une. */
  editing?: TransactionWithRelations;
}

export function TransactionForm({ onDone, fixedType, editing }: Props) {
  const [type, setType] = useState<FormType>(
    (editing?.type as FormType | undefined) ?? fixedType ?? 'expense',
  );
  const [amountInput, setAmountInput] = useState(editing ? String(editing.amount).replace('.', ',') : '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [date, setDate] = useState(editing?.transaction_date ?? todayIso());
  const [categoryId, setCategoryId] = useState<string | null>(editing?.category_id ?? null);
  const [sourceId, setSourceId] = useState<string | null>(editing?.source_account_id ?? null);
  const [destinationId, setDestinationId] = useState<string | null>(editing?.destination_account_id ?? null);

  const kind = TYPE_TO_KIND[type];
  const categories = useQuery({
    queryKey: ['categories', kind ?? 'all'],
    queryFn: () => listCategories(kind),
    enabled: type !== 'transfer',
  });
  const accounts = useQuery({ queryKey: ['account-balances'], queryFn: listAccountBalances });
  const create = useCreateTransaction();
  const update = useUpdateTransaction();
  const busy = create.isPending || update.isPending;

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

    const input: NewTransactionInput = {
      type,
      description,
      amount,
      transaction_date: date,
      category_id: categoryId,
      source_account_id: sourceId,
      destination_account_id: type === 'transfer' ? destinationId : null,
    };
    const onError = (e: Error) => Alert.alert('Enregistrement impossible', e.message);

    if (editing) {
      update.mutate({ id: editing.id, input }, { onSuccess: () => onDone(), onError });
    } else {
      create.mutate(input, { onSuccess: () => onDone(), onError });
    }
  };

  return (
    <View className="gap-4 rounded-2xl bg-white p-4 dark:bg-zinc-900">
      {!fixedType && !editing ? (
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

      <SubmitButton
        label={busy ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Enregistrer'}
        onPress={submit}
        disabled={busy}
      />
    </View>
  );
}
