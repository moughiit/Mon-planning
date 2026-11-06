import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';

export default function RegisterScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || password.length < 8) {
      return Alert.alert('Vérifie le formulaire', 'Email requis et mot de passe d’au moins 8 caractères.');
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: displayName.trim() || undefined } },
    });
    setLoading(false);

    if (error) return Alert.alert('Inscription impossible', error.message);
    // Si la confirmation par email est activée, il n'y a pas encore de session.
    if (!data.session) {
      Alert.alert('Vérifie ta boîte mail', 'Confirme ton adresse pour activer le compte.');
      router.replace('/login');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-stone-100 dark:bg-zinc-950">
      <View className="flex-1 justify-center gap-4 px-6">
        <Text className="text-3xl font-bold text-stone-900 dark:text-stone-50">Créer un compte</Text>

        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Prénom (facultatif)"
          textContentType="givenName"
          className="rounded-xl bg-white px-4 py-3 text-stone-900 dark:bg-zinc-900 dark:text-stone-50"
          placeholderTextColor="#A8A29E"
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          className="rounded-xl bg-white px-4 py-3 text-stone-900 dark:bg-zinc-900 dark:text-stone-50"
          placeholderTextColor="#A8A29E"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Mot de passe (8 caractères minimum)"
          secureTextEntry
          autoCapitalize="none"
          textContentType="newPassword"
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
            <Text className="font-semibold text-white dark:text-stone-900">Créer mon compte</Text>
          )}
        </Pressable>

        <Link href="/login" className="text-center text-stone-600 dark:text-stone-300">
          Déjà un compte ? Se connecter
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
