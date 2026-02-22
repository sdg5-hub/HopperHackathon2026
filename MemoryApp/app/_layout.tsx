import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/theme';

export default function RootLayout() {
  const theme = useTheme();

  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="meds" />
        <Stack.Screen name="safety-check" />
        <Stack.Screen name="emergency-card" />
        <Stack.Screen name="missed-dose-guidance" />
      </Stack>
    </>
  );
}
