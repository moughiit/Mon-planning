import { Text, View } from 'react-native';
import { formatMoney } from '@/utils/money';

interface Props {
  label: string;
  value: number;
  currency?: string;
  /** Couleur de la valeur (ex. vert pour un revenu). */
  color?: string;
  hint?: string;
}

export function KPICard({ label, value, currency = 'EUR', color, hint }: Props) {
  return (
    <View className="flex-1 rounded-2xl bg-white p-4 dark:bg-zinc-900">
      <Text className="text-xs text-stone-500 dark:text-stone-400">{label}</Text>
      <Text
        className="mt-1 text-lg font-bold text-stone-900 dark:text-stone-50"
        style={color ? { color } : undefined}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formatMoney(value, currency)}
      </Text>
      {hint ? <Text className="mt-1 text-xs text-stone-400">{hint}</Text> : null}
    </View>
  );
}
