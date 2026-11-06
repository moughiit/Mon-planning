import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AccountCard } from '@/components/AccountCard';
import { ACCOUNT_TYPE_LABELS } from '@/constants/labels';
import { createAccount, listAccountBalances } from '@/services/accounts';
import type { AccountType } from '@/types/database';
import { parseAmount } from '@/utils/money';

const TYPES: AccountType[] = ['checking', 'savings', 'cash', 'other'];

export default function AccountsScreen() {
  const queryClient = useQueryClient();
  const accounts = useQuery({ queryKey: ['account-balances'], queryFn: listAccountBalances });

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [openingInput, setOpeningInput] = useState('0');

  const create = useMutation({
    mutationFn: () => {
      const opening = openingInput.trim() === '' ? 0 : parseAmount(openingInput);
      if (!name.trim()) throw new Error('Donne un nom au compte.');
      if (opening === null) throw new Error('Solde initial invalide.');
      return createAccount({ name, type, opening_balance: opening });
    },
    onSuccess: () => {
      setName('');
      setOpeningInput('0');
      queryClient.invalidateQueries({ queryKey: ['account-balances'] });
    },
    onError: (e: Error) => Alert.alert('Création impossible', e.message),
  });

  return (
    <ScrollView className="flex-1 bg-stone-100 dark:bg-zinc-950" contentContainerClassName="gap-4 p-4">
      <View className="gap-3 rounded-2xl bg-white p-4 dark:bg-zinc-900">
        <Text className="text-lg font-semibold text-stone-900 dark:text-stone-50">Nouveau compte</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nom (ex. Banque principale)"
          className="rounded-xl bg-stone-100 px-4 py-3 text-stone-900 dark:bg-zinc-800 dark:text-stone-50"
          placeholderTextColor="#A8A29E"
        />
        <View className="flex-row flex-wrap gap-2">
          {TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              className={`rounded-full px-3 py-2 ${t === type ? 'bg-stone-900 dark:bg-stone-100' : 'bg-stone-100 dark:bg-zinc-800'}`}
            >
              <Text className={t === type ? 'text-white dark:text-stone-900' : 'text-stone-700 dark:text-stone-200'}>
                {ACCOUNT_TYPE_LABELS[t]}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={openingInput}
          onChangeText={setOpeningInput}
          keyboardType="decimal-pad"
          placeholder="Solde initial (€)"
          className="rounded-xl bg-stone-100 px-4 py-3 text-stone-900 dark:bg-zinc-800 dark:text-stone-50"
          placeholderTextColor="#A8A29E"
        />
        <Pressable
          onPress={() => create.mutate()}
          disabled={create.isPending}
          className="items-center rounded-xl bg-stone-900 py-3 disabled:opacity-50 dark:bg-stone-100"
        >
          <Text className="font-semibold text-white dark:text-stone-900">
            {create.isPending ? 'Création…' : 'Créer le compte'}
          </Text>
        </Pressable>
      </View>

      {accounts.isLoading ? (
        <ActivityIndicator />
      ) : (accounts.data ?? []).length === 0 ? (
        <Text className="text-center text-stone-500">Aucun compte pour l’instant.</Text>
      ) : (
        (accounts.data ?? []).map((a) => <AccountCard key={a.account_id} account={a} />)
      )}
    </ScrollView>
  );
}
