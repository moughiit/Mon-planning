import '../global.css';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabase';
import { startForegroundRefresh } from '@/services/synchronization';
import { useAppStore } from '@/store/useAppStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export default function RootLayout() {
  const setSession = useAppStore((s) => s.setSession);
  const setInitialized = useAppStore((s) => s.setInitialized);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setInitialized(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, [setSession, setInitialized]);

  useEffect(() => startForegroundRefresh(queryClient), []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="accounts" options={{ headerShown: true, title: 'Comptes' }} />
            <Stack.Screen name="income" options={{ headerShown: true, title: 'Revenus' }} />
            <Stack.Screen name="expenses" options={{ headerShown: true, title: 'Dépenses' }} />
            <Stack.Screen name="savings" options={{ headerShown: true, title: 'Épargne' }} />
            <Stack.Screen name="debts" options={{ headerShown: true, title: 'Dettes' }} />
            <Stack.Screen name="budgets" options={{ headerShown: true, title: 'Budgets' }} />
            <Stack.Screen name="calendar" options={{ headerShown: true, title: 'Calendrier' }} />
            <Stack.Screen name="reports" options={{ headerShown: true, title: 'Rapports' }} />
          </Stack>
        </AuthGate>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

/** Écran affiché par expo-router si une erreur de rendu n'est pas rattrapée plus bas. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => unknown }) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-stone-100 p-6 dark:bg-zinc-950">
      <Text className="text-xl font-bold text-stone-900 dark:text-stone-50">Une erreur est survenue</Text>
      <Text className="text-center text-stone-500">{error.message}</Text>
      <Pressable onPress={() => retry()} className="rounded-xl bg-stone-900 px-6 py-3 dark:bg-stone-100">
        <Text className="font-semibold text-white dark:text-stone-900">Réessayer</Text>
      </Pressable>
    </View>
  );
}

/** Redirige vers la connexion sans session, et hors de la connexion avec une session. */
function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const session = useAppStore((s) => s.session);
  const initialized = useAppStore((s) => s.initialized);

  useEffect(() => {
    if (!initialized) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) router.replace('/login');
    if (session && inAuthGroup) router.replace('/(tabs)');
  }, [initialized, session, segments, router]);

  if (!initialized) {
    return (
      <View className="flex-1 items-center justify-center bg-stone-100 dark:bg-zinc-950">
        <ActivityIndicator />
      </View>
    );
  }
  return <>{children}</>;
}
