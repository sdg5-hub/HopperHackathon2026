import { type ReactNode, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppCard } from '@/components/core/AppCard';
import { Callout } from '@/components/core/Callout';
import { Screen } from '@/components/core/Screen';
import { SeverityBadge } from '@/components/core/SeverityBadge';
import { DISCLAIMERS } from '@/lib/app/constants';
import { getMedicationById, listSchedulesForMedication } from '@/lib/db/queries';
import { describeSchedule } from '@/lib/app/data';
import { useTheme } from '@/theme';

function AccordionSection({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  return (
    <AppCard>
      <Pressable onPress={() => setOpen((v) => !v)} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ fontWeight: '700', color: theme.colors.text }}>{title}</Text>
      </Pressable>
      {open ? <View>{children}</View> : null}
    </AppCard>
  );
}

export default function MissedDoseGuidanceScreen() {
  const theme = useTheme();
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
    <Screen
      title="Missed Dose Guidance"
      subtitle="General safety-first steps for this medication."
      canGoBack
      fallbackRoute="/(tabs)/history"
    >
      <AppCard>
        <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{name}</Text>
        <Text style={{ color: theme.colors.mutedText }}>{scheduleSummary}</Text>
      </AppCard>

      {customGuidance ? (
        <AppCard>
          <Text style={{ fontWeight: '700', color: theme.colors.text }}>Custom guidance</Text>
          <Text style={{ color: theme.colors.mutedText }}>{customGuidance}</Text>
        </AppCard>
      ) : (
        <>
          <AccordionSection title="If you're within a short window">
            <Text style={{ color: theme.colors.mutedText }}>Take it now ONLY if your clinician's instructions allow; otherwise skip.</Text>
          </AccordionSection>
          <AccordionSection title="If it's close to the next dose">
            <Text style={{ color: theme.colors.mutedText }}>Skip missed dose and resume next scheduled dose.</Text>
          </AccordionSection>
          <AccordionSection title="Never do this">
            <Text style={{ color: '#991B1B', fontWeight: '700' }}>Do not double up.</Text>
          </AccordionSection>
        </>
      )}

      <AppCard>
        <Text style={{ fontWeight: '700', color: theme.colors.text }}>When to get help</Text>
        <Text style={{ color: theme.colors.mutedText }}>Severe breathing issues, swelling, or fainting:</Text>
        <SeverityBadge level="emergency" />
        <Text style={{ color: theme.colors.mutedText }}>New severe side effects or chest pain:</Text>
        <SeverityBadge level="urgent" />
        <Text style={{ color: theme.colors.mutedText }}>{DISCLAIMERS.NOT_EXHAUSTIVE}</Text>
      </AppCard>

      <Callout tone="warning">This is general guidance. Contact your pharmacist or doctor for personal instructions.</Callout>
      <Callout tone="danger">{DISCLAIMERS.NOT_MEDICAL_ADVICE}</Callout>
    </Screen>
  );
}
