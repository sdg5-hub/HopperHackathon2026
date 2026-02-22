import { Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

export default function MedsLayout() {
  const theme = useTheme();
  const BackButton = ({ label }: { label: string }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/meds'))}
      style={({ pressed }) => ({
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.accentSoft,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Ionicons name="chevron-back" size={20} color={theme.colors.accent} />
    </Pressable>
  );

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTitleStyle: { color: theme.colors.text, fontWeight: '700' },
        headerTintColor: theme.colors.accent,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Medications',
          headerLeft: () => <BackButton label="Back to meds tab" />,
        }}
      />
      <Stack.Screen name="new" options={{ title: 'Add Medication', headerLeft: () => <BackButton label="Back" /> }} />
      <Stack.Screen name="scan" options={{ title: 'Scan Barcode', headerLeft: () => <BackButton label="Back" /> }} />
      <Stack.Screen name="[id]" options={{ title: 'Medication Detail', headerLeft: () => <BackButton label="Back" /> }} />
      <Stack.Screen name="edit/[id]" options={{ title: 'Edit Medication', headerLeft: () => <BackButton label="Back" /> }} />
    </Stack>
  );
}
