import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { TRANSACTION_TYPE_LABELS } from '@/constants/labels';
import { listAccountBalances } from '@/services/accounts';
import { listCategories } from '@/services/categories';
import { useCreateTransaction } from '@/hooks/useTransactions';
import type { CategoryKind } from '@/types/database';
import { parseAmount } from '@/utils/money';
import { todayIso } from '@/utils/dates';

type FormType = 'expense' | 'income' | 'transfer';

const TYPE_TO_KIND: Partial<Record<FormType, CategoryKind>> = { expense: 'expense', income: 'income' };

export function TransactionForm({ onDone }: { onDone: () => void }) {
  const [type, setType] = useState<FormType>('expense');
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
      <Chips
        options={(['expense', 'income', 'transfer'] as FormType[]).map((t) => ({ id: t, label: TRANSACTION_TYPE_LABELS[t] }))}
        selected={type}
        onSelect={(t) => {
          setType(t as FormType);
          setCategoryId(null);
          if (t !== 'transfer') setDestinationId(null);
        }}
      />

      <Field label="Montant (€)">
        <TextInput
          value={amountInput}
          onChangeText={setAmountInput}
          keyboardType="decimal-pad"
          placeholder="0,00"
          className="rounded-xl bg-stone-100 px-4 py-3 text-lg text-stone-900 dark:bg-zinc-800 dark:text-stone-50"
          placeholderTextColor="#A8A29E"
        />
      </Field>

      <Field label="Description">
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Ex. Courses, salaire…"
          className="rounded-xl bg-stone-100 px-4 py-3 text-stone-900 dark:bg-zinc-800 dark:text-stone-50"
          placeholderTextColor="#A8A29E"
        />
      </Field>

      <Field label="Date (AAAA-MM-JJ)">
        <TextInput
          value={date}
          onChangeText={setDate}
          autoCapitalize="none"
          className="rounded-xl bg-stone-100 px-4 py-3 text-stone-900 dark:bg-zinc-800 dark:text-stone-50"
        />
      </Field>

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
        <Chips
          options={(accounts.data ?? []).map((a) => ({ id: a.account_id, label: a.name }))}
          selected={sourceId}
          onSelect={setSourceId}
        />
      </Field>

      {type === 'transfer' ? (
        <Field label="Compte crédité">
          <Chips
            options={(accounts.data ?? []).map((a) => ({ id: a.account_id, label: a.name }))}
            selected={destinationId}
            onSelect={setDestinationId}
          />
        </Field>
      ) : null}

      <Pressable
        onPress={submit}
        disabled={create.isPending}
        className="items-center rounded-xl bg-stone-900 py-3 disabled:opacity-50 dark:bg-stone-100"
      >
        <Text className="font-semibold text-white dark:text-stone-900">
          {create.isPending ? 'Enregistrement…' : 'Enregistrer'}
        </Text>
      </Pressable>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</Text>
      {children}
    </View>
  );
}

function Chips({
  options,
  selected,
  onSelect,
  allowNone = false,
}: {
  options: { id: string; label: string }[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  allowNone?: boolean;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((o) => {
        const active = o.id === selected;
        return (
          <Pressable
            key={o.id}
            onPress={() => onSelect(allowNone && active ? null : o.id)}
            className={`rounded-full px-3 py-2 ${active ? 'bg-stone-900 dark:bg-stone-100' : 'bg-stone-100 dark:bg-zinc-800'}`}
          >
            <Text
              className={`text-sm ${active ? 'font-semibold text-white dark:text-stone-900' : 'text-stone-700 dark:text-stone-200'}`}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
