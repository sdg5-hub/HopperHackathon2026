import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { AppButton } from '@/components/core/AppButton';
import { AppCard } from '@/components/core/AppCard';
import { Callout } from '@/components/core/Callout';
import { Screen } from '@/components/core/Screen';
import { SeverityBadge } from '@/components/core/SeverityBadge';
import { DISCLAIMERS } from '@/lib/app/constants';
import { setSafetyAcknowledged } from '@/lib/app/settings';
import { useTheme } from '@/theme';

export default function SafetyCheckScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ returnTo?: string }>();

  const onAccept = async () => {
    await setSafetyAcknowledged(true);
    if (params.returnTo) {
      router.replace(params.returnTo as any);
    } else {
      router.back();
    }
  };

  return (
    <Screen
      title="Safety Check"
      subtitle="Quick local guidance before you continue."
      canGoBack
      fallbackRoute="/(tabs)"
    >
      <AppCard>
        <Text style={{ fontWeight: '700', color: theme.colors.text }}>Local interaction rules</Text>
        <Text style={{ color: theme.colors.mutedText }}>- Avoid doubling doses unless your prescriber explicitly advised it.</Text>
        <Text style={{ color: theme.colors.mutedText }}>- Check interactions with alcohol, grapefruit, and OTC meds before combining.</Text>
        <Text style={{ color: theme.colors.mutedText }}>- If you experience severe symptoms (trouble breathing, swelling, fainting), seek emergency care.</Text>
      </AppCard>

      <AppCard>
        <Text style={{ fontWeight: '700', color: theme.colors.text }}>Severity badges legend</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <SeverityBadge level="emergency" />
          <SeverityBadge level="urgent" />
          <SeverityBadge level="routine" />
          <SeverityBadge level="info" />
        </View>
      </AppCard>

      <Callout tone="info">{DISCLAIMERS.NOT_EXHAUSTIVE}</Callout>
      <Callout tone="danger">{DISCLAIMERS.NOT_MEDICAL_ADVICE}</Callout>

      <AppButton label="I Understand" onPress={onAccept} />
      <AppButton label="View Emergency Card" tone="secondary" onPress={() => router.push('/emergency-card')} />
    </Screen>
  );
}
