import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { AppButton } from '@/components/core/AppButton';
import { AppCard } from '@/components/core/AppCard';

export default function OnboardingWelcomeScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 18, gap: 14 }}>
      <Text style={{ fontSize: 28, fontWeight: '800', color: '#0F172A' }}>Welcome to RxShield</Text>
      <Text style={{ color: '#334155', fontSize: 16 }}>
        Track prescription doses, get reminder nudges, and log outcomes with local-first privacy.
      </Text>

      <AppCard>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#7F1D1D' }}>Safety Disclaimer</Text>
        <Text style={{ color: '#475569' }}>
          This app is not medical advice. In emergencies call local emergency services immediately.
        </Text>
        <Text style={{ color: '#475569' }}>
          Guidance here is not exhaustive. Always confirm medication questions with your pharmacist or clinician.
        </Text>
      </AppCard>

      <AppCard>
        <Text style={{ fontWeight: '700', color: '#0F172A' }}>Privacy</Text>
        <Text style={{ color: '#475569' }}>
          Your data is stored locally on your device. No remote servers are required.
        </Text>
      </AppCard>

      <View style={{ marginTop: 8 }}>
        <AppButton label="Continue" onPress={() => router.push('/(onboarding)/permissions')} />
      </View>
    </ScrollView>
  );
}
