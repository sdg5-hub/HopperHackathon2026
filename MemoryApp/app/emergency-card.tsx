import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Share } from 'react-native';
import { AppButton } from '@/components/core/AppButton';
import { EmergencyCardWidget } from '@/components/core/EmergencyCardWidget';
import { FormField } from '@/components/core/FormField';
import { AppCard } from '@/components/core/AppCard';
import { buildEmergencySummaryText, getEmergencyInfo, saveEmergencyInfo } from '@/lib/app/emergency';
import { listMedicationsWithMeta } from '@/lib/app/data';

export default function EmergencyCardScreen() {
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
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <EmergencyCardWidget data={{ name, allergies, conditions, contactName, contactPhone }} medsSummary={medsSummary} />

      <AppCard>
        <FormField label="Name" value={name} onChangeText={setName} />
        <FormField label="Allergies" value={allergies} onChangeText={setAllergies} />
        <FormField label="Conditions" value={conditions} onChangeText={setConditions} />
        <FormField label="Emergency Contact Name" value={contactName} onChangeText={setContactName} />
        <FormField label="Emergency Contact Phone" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
      </AppCard>

      <AppButton label="Save Emergency Card" onPress={onSave} />
      <AppButton label="Share Emergency Summary" tone="secondary" onPress={onShare} />
    </ScrollView>
  );
}
