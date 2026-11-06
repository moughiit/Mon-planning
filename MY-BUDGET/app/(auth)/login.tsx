import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/services/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) return Alert.alert('Email et mot de passe requis');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    // En cas de succès, la garde d'authentification redirige automatiquement.
    if (error) Alert.alert('Connexion impossible', error.message);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-stone-100 dark:bg-zinc-950">
      <View className="flex-1 justify-center gap-4 px-6">
        <Text className="text-3xl font-bold text-stone-900 dark:text-stone-50">MY BUDGET</Text>
        <Text className="text-stone-500">Connecte-toi pour suivre ton budget.</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          className="rounded-xl bg-white px-4 py-3 text-stone-900 dark:bg-zinc-900 dark:text-stone-50"
          placeholderTextColor="#A8A29E"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Mot de passe"
          secureTextEntry
          autoCapitalize="none"
          textContentType="password"
          className="rounded-xl bg-white px-4 py-3 text-stone-900 dark:bg-zinc-900 dark:text-stone-50"
          placeholderTextColor="#A8A29E"
        />

        <Pressable
          onPress={submit}
          disabled={loading}
          className="items-center rounded-xl bg-stone-900 py-3 disabled:opacity-50 dark:bg-stone-100"
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text className="font-semibold text-white dark:text-stone-900">Se connecter</Text>
          )}
        </Pressable>

        <Link href="/register" className="text-center text-stone-600 dark:text-stone-300">
          Pas de compte ? Créer un compte
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
