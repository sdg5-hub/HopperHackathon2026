import { useCallback, useEffect, useState } from 'react';
import { Alert, Share, Text, View } from 'react-native';
import { AppButton } from '@/components/core/AppButton';
import { Callout } from '@/components/core/Callout';
import { EmergencyCardWidget } from '@/components/core/EmergencyCardWidget';
import { FormField } from '@/components/core/FormField';
import { AppCard } from '@/components/core/AppCard';
import { Screen } from '@/components/core/Screen';
import { buildEmergencySummaryText, getEmergencyInfo, saveEmergencyInfo } from '@/lib/app/emergency';
import { listMedicationsWithMeta } from '@/lib/app/data';
import { useTheme } from '@/theme';

export default function EmergencyCardScreen() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [medsSummary, setMedsSummary] = useState<string[]>([]);

  const load = useCallback(async () => {
    const info = await getEmergencyInfo();
    setName(info.name);
    setAllergies(info.allergies);
    setConditions(info.conditions);
    setContactName(info.contactName);
    setContactPhone(info.contactPhone);

    const meds = await listMedicationsWithMeta();
    setMedsSummary(meds.filter((m) => m.medication.isActive === 1).map((m) => `${m.medication.name}${m.medication.dosage ? ` (${m.medication.dosage})` : ''}`));
  }, []);

  useEffect(() => {
    load().catch((error) => console.warn('[emergency] load failed', error));
  }, [load]);

  const onSave = async () => {
    await saveEmergencyInfo({ name, allergies, conditions, contactName, contactPhone });
    Alert.alert('Saved', 'Emergency card saved locally.');
  };

  const onShare = async () => {
    try {
      const summary = await buildEmergencySummaryText({ name, allergies, conditions, contactName, contactPhone });
      await Share.share({ message: summary });
    } catch (error) {
      Alert.alert('Share failed', error instanceof Error ? error.message : 'Unable to share emergency summary.');
    }
  };

  return (
    <Screen
      title="Emergency Card"
      subtitle="Keep this visible-ready for urgent situations."
      canGoBack
      fallbackRoute="/(tabs)"
    >
      <EmergencyCardWidget data={{ name, allergies, conditions, contactName, contactPhone }} medsSummary={medsSummary} />
      <Callout tone="danger">In an emergency, call local emergency services first.</Callout>

      <AppCard>
        <FormField label="Name" value={name} onChangeText={setName} />
        <FormField label="Allergies" value={allergies} onChangeText={setAllergies} />
        <FormField label="Conditions" value={conditions} onChangeText={setConditions} />
        <FormField label="Emergency Contact Name" value={contactName} onChangeText={setContactName} />
        <FormField label="Emergency Contact Phone" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
      </AppCard>

      <View style={{ gap: theme.spacing[2] }}>
        <Text style={{ color: theme.colors.mutedText, fontWeight: '600' }}>One-tap share</Text>
        <AppButton label="Share Emergency Summary" onPress={onShare} />
        <AppButton label="Save Emergency Card" tone="secondary" onPress={onSave} />
      </View>
    </Screen>
  );
}
