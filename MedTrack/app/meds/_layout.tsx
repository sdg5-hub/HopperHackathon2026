import { Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

export default function MedsLayout() {
  const theme = useTheme();

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
          headerLeft: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to meds tab"
              onPress={() => router.replace('/(tabs)/meds')}
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
          ),
        }}
      />
      <Stack.Screen name="new" options={{ title: 'Add Medication' }} />
      <Stack.Screen name="scan" options={{ title: 'Scan Label' }} />
      <Stack.Screen name="[id]" options={{ title: 'Medication Detail' }} />
      <Stack.Screen name="edit/[id]" options={{ title: 'Edit Medication' }} />
    </Stack>
  );
}
