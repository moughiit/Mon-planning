import { Redirect } from 'expo-router';

// La garde d'authentification (app/_layout.tsx) redirige ensuite vers /login si besoin.
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
