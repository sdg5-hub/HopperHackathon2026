import { useState } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Alert, ScrollView, Text } from 'react-native';
import { AppButton } from '@/components/core/AppButton';
import { AppCard } from '@/components/core/AppCard';
import { useTheme } from '@/theme';

export default function OnboardingPermissionScreen() {
  const theme = useTheme();
  const [requesting, setRequesting] = useState(false);

  const onAllow = async () => {
    try {
      setRequesting(true);
      await Notifications.requestPermissionsAsync();
      router.push('/(onboarding)/profile');
    } catch (error) {
      Alert.alert('Permission error', error instanceof Error ? error.message : 'Unable to request notifications.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 18, gap: 14 }}>
      <Text style={{ ...theme.typography.title, color: theme.colors.text }}>Reminders Permission</Text>
      <Text style={{ color: theme.colors.mutedText }}>MedTrack uses local notifications so you do not miss scheduled doses.</Text>

      <AppCard>
        <Text style={{ color: theme.colors.mutedText }}>We only use on-device notifications. No push servers, no third-party medical APIs.</Text>
      </AppCard>

      <AppButton label={requesting ? 'Requesting...' : 'Allow Notifications'} disabled={requesting} onPress={onAllow} />
      <AppButton tone="secondary" label="Not Now" onPress={() => router.push('/(onboarding)/profile')} />
    </ScrollView>
  );
}
