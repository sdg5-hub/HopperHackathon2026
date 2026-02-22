import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'RxShield Home' }} />
      <Stack.Screen name="onboarding" options={{ title: 'Onboarding & Safety' }} />
      <Stack.Screen name="medications/index" options={{ title: 'Medications' }} />
      <Stack.Screen name="medications/new" options={{ title: 'Add Medication' }} />
      <Stack.Screen name="medications/[id]" options={{ title: 'Medication Details' }} />
    </Stack>
  );
}
