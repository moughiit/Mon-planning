import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

// La couleur peut être un nombre sur certaines plateformes : on ne garde que les chaînes.
const iconColor = (color: unknown) => (typeof color === 'string' ? color : undefined);

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#1C1917' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={iconColor(color)} />,
        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: 'Opérations',
          tabBarIcon: ({ color, size }) => <Ionicons name="swap-horizontal-outline" size={size} color={iconColor(color)} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analyse',
          tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart-outline" size={size} color={iconColor(color)} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={iconColor(color)} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Réglages',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={iconColor(color)} />,
        }}
      />
    </Tabs>
  );
}
