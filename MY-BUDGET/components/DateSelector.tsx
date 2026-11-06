import { Pressable, Text, View } from 'react-native';
import { monthLabel, type YearMonth } from '@/utils/dates';

interface Props {
  period: YearMonth;
  onChange: (delta: number) => void;
}

export function DateSelector({ period, onChange }: Props) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Pressable
        onPress={() => onChange(-1)}
        accessibilityLabel="Mois précédent"
        className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-zinc-900"
      >
        <Text className="text-lg text-stone-700 dark:text-stone-200">‹</Text>
      </Pressable>
      <Text className="text-base font-semibold capitalize text-stone-900 dark:text-stone-50">
        {monthLabel(period)}
      </Text>
      <Pressable
        onPress={() => onChange(1)}
        accessibilityLabel="Mois suivant"
        className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-zinc-900"
      >
        <Text className="text-lg text-stone-700 dark:text-stone-200">›</Text>
      </Pressable>
    </View>
  );
}
