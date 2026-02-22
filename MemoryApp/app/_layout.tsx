import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="meds" />
      <Stack.Screen name="safety-check" options={{ headerShown: true, title: 'Safety Check' }} />
      <Stack.Screen name="emergency-card" options={{ headerShown: true, title: 'Emergency Card' }} />
      <Stack.Screen name="missed-dose-guidance" options={{ headerShown: true, title: 'Missed Dose Guidance' }} />
    </Stack>
  );
}
