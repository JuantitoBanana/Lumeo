import { Stack } from 'expo-router';

export default function TabsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen name="coins" options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen name="budgets" options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen name="savings" options={{ headerShown: false, animation: 'none' }} />
      <Stack.Screen name="profile" options={{ headerShown: false, animation: 'none' }} />
    </Stack>
  );
}
