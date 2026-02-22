import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppButton } from '@/components/core/AppButton';
import { AppCard } from '@/components/core/AppCard';
import { MedicationForm, createDefaultMedicationFormState } from '@/components/core/MedicationForm';
import { createMedication, createSchedule, getPrimaryUser, setMedicationWarningTags } from '@/lib/db/queries';
import type { SchedulePayload, ScheduleType } from '@/lib/db/types';
import { getNotificationDbAdapter } from '@/lib/notifications/sqlite-adapter';
import { resyncMedication } from '@/lib/notifications/engine';
import type { ScanDraft } from '@/lib/app/scan-parser';

const db = getNotificationDbAdapter();

function toSchedulePayload(scheduleType: ScheduleType, form: ReturnType<typeof createDefaultMedicationFormState>): SchedulePayload {
  if (scheduleType === 'fixed_times') {
    return {
      times: form.fixedTimes
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    };
  }

  if (scheduleType === 'every_x_hours') {
    return {
      intervalHours: Math.max(1, Number(form.intervalHours) || 8),
      startTime: form.intervalStart || '07:00'
    };
  }

  if (scheduleType === 'days_of_week') {
    return {
      days: form.daysOfWeek
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6),
      time: form.dayTime || '09:00'
    };
  }

  return {
    notes: 'as needed'
  };
}

function decodeScanPayload(raw?: string | string[]): ScanDraft | null {
  if (!raw) return null;
  const encoded = Array.isArray(raw) ? raw[0] : raw;
  if (!encoded) return null;

  try {
    return JSON.parse(decodeURIComponent(encoded)) as ScanDraft;
  } catch {
    return null;
  }
}

export default function AddMedicationScreen() {
  const { scanPayload } = useLocalSearchParams<{ scanPayload?: string }>();
  const [form, setForm] = useState(createDefaultMedicationFormState());
  const [saving, setSaving] = useState(false);

  const parsedScan = useMemo(() => decodeScanPayload(scanPayload), [scanPayload]);

  useEffect(() => {
    if (!parsedScan) return;

    setForm((prev) => ({
      ...prev,
      name: parsedScan.name || prev.name,
      dosage: parsedScan.dosage || prev.dosage,
      instructions: parsedScan.instructions || prev.instructions,
      form: parsedScan.form || prev.form,
      warningTags: Array.from(new Set([...prev.warningTags, ...(parsedScan.warningTags ?? [])]))
    }));
  }, [parsedScan]);

  const onSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Medication name is required.');
      return;
    }

    try {
      setSaving(true);
      const user = await getPrimaryUser();
      const medication = await createMedication({
        userId: user?.id ?? null,
        name: form.name.trim(),
        dosage: form.dosage.trim() || null,
        form: form.form,
        instructions: form.instructions.trim() || null,
        doctorContact: form.doctorContact.trim() || null,
        pharmacyContact: form.pharmacyContact.trim() || null,
        missedDoseGuidance: form.missedDoseGuidance.trim() || null,
        startDate: Date.now(),
        isActive: 1
      });

      const payload = toSchedulePayload(form.scheduleType, form);
      await createSchedule(medication.id, form.scheduleType, payload, Intl.DateTimeFormat().resolvedOptions().timeZone);

      await setMedicationWarningTags(medication.id, form.warningTags);
      await resyncMedication(db, medication.id);

      Alert.alert('Saved', 'Medication added successfully.');
      router.replace('/meds');
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Unable to save medication.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 28 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A' }}>Add Medication</Text>
        <AppButton label="Scan Label" tone="secondary" onPress={() => router.push('/meds/scan')} style={{ paddingHorizontal: 12 }} />
      </View>

      <Text style={{ color: '#64748B' }}>Camera scan prefills fields; always confirm details before saving.</Text>

      <AppCard>
        <MedicationForm value={form} onChange={setForm} />
      </AppCard>
      <AppButton label={saving ? 'Saving...' : 'Save Medication'} onPress={onSave} disabled={saving} />
    </ScrollView>
  );
}
