import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { DateSelector } from '@/components/DateSelector';
import { KPICard } from '@/components/KPICard';
import { COLORS } from '@/constants/theme';
import { listCategories } from '@/services/categories';
import { spentByCategory } from '@/services/budgets';
import type { Budget, Category } from '@/types/database';
import { useBudgets, useRemoveBudget, useSaveBudget } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { useAppStore } from '@/store/useAppStore';
import { formatMoney, parseNonNegative } from '@/utils/money';

export default function BudgetsScreen() {
  const period = useAppStore((s) => s.selectedMonth);
  const shift = useAppStore((s) => s.shiftSelectedMonth);

  const categories = useQuery({ queryKey: ['categories', 'expense'], queryFn: () => listCategories('expense') });
  const budgets = useBudgets(period);
  const transactions = useTransactions(period);
  const save = useSaveBudget(period);
  const remove = useRemoveBudget();

  const spent = useMemo(() => spentByCategory(transactions.data ?? []), [transactions.data]);
  const budgetByCategory = useMemo(() => {
    const map = new Map<string, Budget>();
    for (const b of budgets.data ?? []) if (b.category_id) map.set(b.category_id, b);
    return map;
  }, [budgets.data]);

  if (categories.isLoading || budgets.isLoading || transactions.isLoading) {
    return <ActivityIndicator className="mt-8" />;
  }

  const cats = categories.data ?? [];
  const totalBudget = cats.reduce((sum, c) => sum + (budgetByCategory.get(c.id)?.amount ?? 0), 0);
  const totalSpent = cats.reduce((sum, c) => sum + (spent.get(c.id) ?? 0), 0);

  const onSave = (category: Category, input: string) => {
    const existing = budgetByCategory.get(category.id);
    const amount = parseNonNegative(input);
    if (amount === null) return Alert.alert('Montant invalide', 'Saisis un montant positif, ou laisse vide pour supprimer.');

    if (input.trim() === '') {
      if (!existing) return;
      return remove.mutate(existing.id, {
        onError: (e: Error) => Alert.alert('Suppression impossible', e.message),
      });
    }
    save.mutate(
      { categoryId: category.id, amount },
      { onError: (e: Error) => Alert.alert('Enregistrement impossible', e.message) },
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-stone-100 dark:bg-zinc-950"
      contentContainerClassName="gap-4 p-4"
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={() => {
            void budgets.refetch();
            void transactions.refetch();
          }}
        />
      }
    >
      <DateSelector period={period} onChange={shift} />

      <View className="flex-row gap-3">
        <KPICard label="Plafonds du mois" value={totalBudget} color={COLORS.savings} />
        <KPICard label="Dépensé" value={totalSpent} color={totalSpent > totalBudget && totalBudget > 0 ? COLORS.expense : undefined} />
      </View>

      <Text className="text-sm text-stone-500">
        Saisis un plafond par catégorie. Laisse vide pour supprimer le plafond d’une catégorie.
      </Text>

      {cats.map((c) => (
        <BudgetRow
          key={`${c.id}-${budgetByCategory.get(c.id)?.amount ?? 'none'}`}
          category={c}
          budget={budgetByCategory.get(c.id)}
          spent={spent.get(c.id) ?? 0}
          onSave={(input) => onSave(c, input)}
        />
      ))}
    </ScrollView>
  );
}

function BudgetRow({
  category,
  budget,
  spent,
  onSave,
}: {
  category: Category;
  budget: Budget | undefined;
  spent: number;
  onSave: (input: string) => void;
}) {
  const [input, setInput] = useState(budget ? String(budget.amount).replace('.', ',') : '');
  const limit = budget?.amount ?? 0;
  const over = limit > 0 && spent > limit;
  const progress = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;

  return (
    <View className="gap-3 rounded-2xl bg-white p-4 dark:bg-zinc-900">
      <View className="flex-row items-center justify-between">
        <Text className="font-semibold text-stone-900 dark:text-stone-50">{category.name}</Text>
        <Text className={over ? 'text-sm font-semibold text-red-700' : 'text-sm text-stone-500'}>
          {formatMoney(spent)}
          {limit > 0 ? ` / ${formatMoney(limit)}` : ''}
        </Text>
      </View>

      {limit > 0 ? (
        <View className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-800">
          <View
            className="h-2 rounded-full"
            style={{ width: `${progress}%`, backgroundColor: over ? COLORS.expense : COLORS.income }}
          />
        </View>
      ) : null}

      {over ? <Text className="text-xs text-red-700">Plafond dépassé de {formatMoney(spent - limit)}</Text> : null}

      <View className="flex-row items-center gap-2">
        <TextInput
          value={input}
          onChangeText={setInput}
          keyboardType="decimal-pad"
          placeholder="Plafond (€)"
          placeholderTextColor="#A8A29E"
          className="flex-1 rounded-xl bg-stone-100 px-4 py-2 text-stone-900 dark:bg-zinc-800 dark:text-stone-50"
        />
        <Pressable onPress={() => onSave(input)} className="rounded-xl bg-stone-900 px-4 py-2 dark:bg-stone-100">
          <Text className="font-semibold text-white dark:text-stone-900">OK</Text>
        </Pressable>
      </View>
    </View>
  );
}
