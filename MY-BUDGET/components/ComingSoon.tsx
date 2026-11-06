import { Text, View } from 'react-native';

/** Écran placeholder pour les fonctionnalités prévues mais pas encore implémentées. */
export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-stone-100 p-6 dark:bg-zinc-950">
      <Text className="text-xl font-bold text-stone-900 dark:text-stone-50">{title}</Text>
      <Text className="mt-2 text-center text-stone-500">{description}</Text>
      <Text className="mt-4 text-xs uppercase tracking-wide text-stone-400">Bientôt disponible</Text>
    </View>
  );
}
