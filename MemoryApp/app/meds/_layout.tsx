import { Stack } from 'expo-router';

export default function MedsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Medications' }} />
      <Stack.Screen name="new" options={{ title: 'Add Medication' }} />
      <Stack.Screen name="scan" options={{ title: 'Scan Label' }} />
      <Stack.Screen name="[id]" options={{ title: 'Medication Detail' }} />
      <Stack.Screen name="edit/[id]" options={{ title: 'Edit Medication' }} />
    </Stack>
  );
}
