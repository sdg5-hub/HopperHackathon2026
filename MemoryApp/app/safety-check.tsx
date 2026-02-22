import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { AppButton } from '@/components/core/AppButton';
import { AppCard } from '@/components/core/AppCard';
import { SeverityBadge } from '@/components/core/SeverityBadge';
import { DISCLAIMERS } from '@/lib/app/constants';
import { setSafetyAcknowledged } from '@/lib/app/settings';

export default function SafetyCheckScreen() {
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
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: '#0F172A' }}>Safety Check</Text>

      <AppCard>
        <Text style={{ fontWeight: '700', color: '#0F172A' }}>Local interaction rules</Text>
        <Text style={{ color: '#475569' }}>- Avoid doubling doses unless your prescriber explicitly advised it.</Text>
        <Text style={{ color: '#475569' }}>- Check interactions with alcohol, grapefruit, and OTC meds before combining.</Text>
        <Text style={{ color: '#475569' }}>- If you experience severe symptoms (trouble breathing, swelling, fainting), seek emergency care.</Text>
      </AppCard>

      <AppCard>
        <Text style={{ fontWeight: '700', color: '#0F172A' }}>Severity badges legend</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <SeverityBadge level="emergency" />
          <SeverityBadge level="urgent" />
          <SeverityBadge level="routine" />
          <SeverityBadge level="info" />
        </View>
      </AppCard>

      <AppCard>
        <Text style={{ color: '#7F1D1D', fontWeight: '700' }}>{DISCLAIMERS.NOT_MEDICAL_ADVICE}</Text>
        <Text style={{ color: '#475569' }}>{DISCLAIMERS.NOT_EXHAUSTIVE}</Text>
      </AppCard>

      <AppButton label="I Understand" onPress={onAccept} />
      <AppButton label="View Emergency Card" tone="secondary" onPress={() => router.push('/emergency-card')} />
    </ScrollView>
  );
}
