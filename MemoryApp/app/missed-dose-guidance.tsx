import { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppCard } from '@/components/core/AppCard';
import { SeverityBadge } from '@/components/core/SeverityBadge';
import { DISCLAIMERS } from '@/lib/app/constants';
import { getMedicationById, listSchedulesForMedication } from '@/lib/db/queries';
import { describeSchedule } from '@/lib/app/data';

export default function MissedDoseGuidanceScreen() {
  const { medicationId } = useLocalSearchParams<{ medicationId?: string }>();
  const [name, setName] = useState('Medication');
  const [scheduleSummary, setScheduleSummary] = useState('Schedule unavailable');
  const [customGuidance, setCustomGuidance] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!medicationId) return;
      const med = await getMedicationById(medicationId);
      if (med) {
        setName(med.name);
        setCustomGuidance(med.missedDoseGuidance ?? null);
      }
      const schedules = await listSchedulesForMedication(medicationId);
      if (schedules[0]) setScheduleSummary(describeSchedule(schedules[0]));
    })().catch((error) => console.warn('[guidance] load failed', error));
  }, [medicationId]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A' }}>Missed Dose Guidance</Text>
      <AppCard>
        <Text style={{ color: '#0F172A', fontWeight: '700' }}>{name}</Text>
        <Text style={{ color: '#475569' }}>{scheduleSummary}</Text>
      </AppCard>

      {customGuidance ? (
        <AppCard>
          <Text style={{ fontWeight: '700', color: '#0F172A' }}>Custom guidance</Text>
          <Text style={{ color: '#475569' }}>{customGuidance}</Text>
        </AppCard>
      ) : (
        <>
          <AppCard>
            <Text style={{ fontWeight: '700', color: '#0F172A' }}>If you're within a short window</Text>
            <Text style={{ color: '#475569' }}>Take it now ONLY if your clinician's instructions allow; otherwise skip.</Text>
          </AppCard>
          <AppCard>
            <Text style={{ fontWeight: '700', color: '#0F172A' }}>If it's close to the next dose</Text>
            <Text style={{ color: '#475569' }}>Skip missed dose and resume next scheduled dose.</Text>
          </AppCard>
          <AppCard>
            <Text style={{ fontWeight: '700', color: '#0F172A' }}>Never do this</Text>
            <Text style={{ color: '#7F1D1D', fontWeight: '700' }}>Do not double up.</Text>
          </AppCard>
        </>
      )}

      <AppCard>
        <Text style={{ fontWeight: '700', color: '#0F172A' }}>When to get help</Text>
        <Text style={{ color: '#475569' }}>Severe breathing issues, swelling, or fainting:</Text>
        <SeverityBadge level="emergency" />
        <Text style={{ color: '#475569' }}>New severe side effects or chest pain:</Text>
        <SeverityBadge level="urgent" />
        <Text style={{ color: '#475569' }}>{DISCLAIMERS.NOT_EXHAUSTIVE}</Text>
      </AppCard>

      <AppCard>
        <Text style={{ color: '#7F1D1D', fontWeight: '700' }}>{DISCLAIMERS.NOT_MEDICAL_ADVICE}</Text>
        <Text style={{ color: '#475569' }}>Contact your pharmacist or doctor for personal instructions.</Text>
      </AppCard>
    </ScrollView>
  );
}
