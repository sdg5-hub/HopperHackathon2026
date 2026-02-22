import { Alert, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '@/components/core/AppButton';
import { AppCard } from '@/components/core/AppCard';
import { setOnboardingComplete } from '@/lib/app/settings';
import { getNotificationDbAdapter } from '@/lib/notifications/sqlite-adapter';
import { resyncAllSchedules } from '@/lib/notifications/engine';

export default function OnboardingFinishScreen() {
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
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 18, gap: 14 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A' }}>You are set</Text>
      <Text style={{ color: '#475569' }}>Next, add your first medication so reminders and logs can start.</Text>

      <AppCard>
        <Text style={{ color: '#334155' }}>Tip: create one medication now, then check Home for due cards and timeline.</Text>
      </AppCard>

      <AppButton label="Finish & Add First Medication" onPress={onFinish} />
    </ScrollView>
  );
}
