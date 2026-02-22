import { Alert, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '@/components/core/AppButton';
import { AppCard } from '@/components/core/AppCard';
import { setOnboardingComplete } from '@/lib/app/settings';
import { getNotificationDbAdapter } from '@/lib/notifications/sqlite-adapter';
import { resyncAllSchedules } from '@/lib/notifications/engine';
import { useTheme } from '@/theme';

export default function OnboardingFinishScreen() {
  const theme = useTheme();
  const onFinish = async () => {
    try {
      await setOnboardingComplete(true);
      await resyncAllSchedules(getNotificationDbAdapter());
      router.replace('/(tabs)/meds');
    } catch (error) {
      Alert.alert('Setup error', error instanceof Error ? error.message : 'Unable to finish setup.');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 18, gap: 14 }}>
      <Text style={{ ...theme.typography.title, color: theme.colors.text }}>You are set</Text>
      <Text style={{ color: theme.colors.mutedText }}>Next, add your first medication so reminders and logs can start.</Text>

      <AppCard>
        <Text style={{ color: theme.colors.mutedText }}>Tip: create one medication now, then check Home for due cards and timeline.</Text>
      </AppCard>

      <AppButton label="Finish & Add First Medication" onPress={onFinish} />
    </ScrollView>
  );
}
