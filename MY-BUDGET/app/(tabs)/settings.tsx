import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colorScheme } from 'nativewind';
import { SECONDARY_SCREENS, THEME_LABELS } from '@/constants/labels';
import { getProfile, updateTheme } from '@/services/profile';
import { supabase } from '@/services/supabase';
import type { ThemePref } from '@/types/database';

const THEMES: ThemePref[] = ['system', 'light', 'dark'];

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ['profile'], queryFn: getProfile });

  const saveTheme = useMutation({
    mutationFn: (theme: ThemePref) => updateTheme(theme),
    onSuccess: (_data, theme) => {
      colorScheme.set(theme);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (e: Error) => Alert.alert('Préférence non enregistrée', e.message),
  });

  const signOut = () => {
    Alert.alert('Se déconnecter ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) Alert.alert('Déconnexion impossible', error.message);
          queryClient.clear();
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-stone-100 dark:bg-zinc-950" contentContainerClassName="gap-5 p-4 pt-14">
      <Text className="text-2xl font-bold text-stone-900 dark:text-stone-50">Réglages</Text>

      <Section title="Profil">
        <Row label="Nom" value={profile.data?.display_name ?? '—'} />
        <Row label="Devise" value={profile.data?.currency ?? 'EUR'} />
      </Section>

      <Section title="Thème">
        <View className="flex-row gap-2 p-3">
          {THEMES.map((t) => {
            const active = profile.data?.theme === t;
            return (
              <Pressable
                key={t}
                onPress={() => saveTheme.mutate(t)}
                disabled={!profile.data || saveTheme.isPending}
                className={`flex-1 items-center rounded-xl py-2 ${active ? 'bg-stone-900 dark:bg-stone-100' : 'bg-stone-100 dark:bg-zinc-800'}`}
              >
                <Text className={active ? 'font-semibold text-white dark:text-stone-900' : 'text-stone-700 dark:text-stone-200'}>
                  {THEME_LABELS[t]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="Écrans secondaires">
        {SECONDARY_SCREENS.map((s) => (
          <Pressable key={s.route} onPress={() => router.push(s.route as never)} className="px-4 py-3">
            <Text className="text-stone-900 dark:text-stone-50">{s.label}</Text>
          </Pressable>
        ))}
      </Section>

      <Pressable onPress={signOut} className="items-center rounded-2xl bg-white py-4 dark:bg-zinc-900">
        <Text className="font-semibold text-red-700">Se déconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-medium uppercase tracking-wide text-stone-500">{title}</Text>
      <View className="divide-y divide-stone-200 overflow-hidden rounded-2xl bg-white dark:divide-zinc-800 dark:bg-zinc-900">
        {children}
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <Text className="text-stone-700 dark:text-stone-200">{label}</Text>
      <Text className="text-stone-500">{value}</Text>
    </View>
  );
}
