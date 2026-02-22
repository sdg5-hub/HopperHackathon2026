import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { AppButton } from '@/components/core/AppButton';
import { AppCard } from '@/components/core/AppCard';
import { useTheme } from '@/theme';

export default function OnboardingWelcomeScreen() {
  const theme = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 18, gap: 14 }}>
      <Text style={{ ...theme.typography.title, color: theme.colors.text }}>Welcome to MedTrack</Text>
      <Text style={{ color: theme.colors.mutedText, fontSize: 16 }}>
        Track prescription doses, get reminder nudges, and log outcomes with local-first privacy.
      </Text>

      <AppCard>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#7F1D1D' }}>Safety Disclaimer</Text>
        <Text style={{ color: theme.colors.mutedText }}>
          This app is not medical advice. In emergencies call local emergency services immediately.
        </Text>
        <Text style={{ color: theme.colors.mutedText }}>
          Guidance here is not exhaustive. Always confirm medication questions with your pharmacist or clinician.
        </Text>
      </AppCard>

      <AppCard>
        <Text style={{ fontWeight: '700', color: theme.colors.text }}>Privacy</Text>
        <Text style={{ color: theme.colors.mutedText }}>
          Your data is stored locally on your device. No remote servers are required.
        </Text>
      </AppCard>

      <View style={{ marginTop: 8 }}>
        <AppButton label="Continue" onPress={() => router.push('/(onboarding)/permissions')} />
      </View>
    </ScrollView>
  );
}
