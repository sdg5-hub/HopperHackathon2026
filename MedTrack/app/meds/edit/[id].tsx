import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppButton } from '@/components/core/AppButton';
import { AppCard } from '@/components/core/AppCard';
import { MedicationForm, createDefaultMedicationFormState } from '@/components/core/MedicationForm';
import { getMedicationById, getMedicationWarningTags, listSchedulesForMedication, setMedicationWarningTags, updateMedication, updateSchedule } from '@/lib/db/queries';
import type { SchedulePayload } from '@/lib/db/types';
import { getNotificationDbAdapter } from '@/lib/notifications/sqlite-adapter';
import { resyncMedication } from '@/lib/notifications/engine';

const db = getNotificationDbAdapter();

function payloadFromState(form: ReturnType<typeof createDefaultMedicationFormState>): SchedulePayload {
  if (form.scheduleType === 'fixed_times') {
    return {
      times: form.fixedTimes
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    };
  }

  if (form.scheduleType === 'every_x_hours') {
    return {
      intervalHours: Math.max(1, Number(form.intervalHours) || 8),
      startTime: form.intervalStart || '07:00'
    };
  }

  if (form.scheduleType === 'days_of_week') {
    return {
      days: form.daysOfWeek
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6),
      time: form.dayTime || '09:00'
    };
  }

  return { notes: 'as needed' };
}

export default function EditMedicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [form, setForm] = useState(createDefaultMedicationFormState());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const med = await getMedicationById(id);
    if (!med) {
      throw new Error('Medication not found');
    }

    const tags = await getMedicationWarningTags(id);
    const schedules = await listSchedulesForMedication(id);
    const schedule = schedules[0] ?? null;

    const next = createDefaultMedicationFormState();
    next.name = med.name;
    next.dosage = med.dosage ?? '';
    next.form = med.form ?? 'pill';
    next.instructions = med.instructions ?? '';
    next.doctorContact = med.doctorContact ?? '';
    next.pharmacyContact = med.pharmacyContact ?? '';
    next.missedDoseGuidance = med.missedDoseGuidance ?? next.missedDoseGuidance;
    next.warningTags = tags;

    if (schedule) {
      next.scheduleType = schedule.type;
      const payload = JSON.parse(schedule.payloadJson);
      if (schedule.type === 'fixed_times') {
        next.fixedTimes = (payload.times ?? []).join(',');
      } else if (schedule.type === 'every_x_hours') {
        next.intervalHours = String(payload.intervalHours ?? 8);
        next.intervalStart = payload.startTime ?? '07:00';
      } else if (schedule.type === 'days_of_week') {
        next.daysOfWeek = (payload.days ?? []).join(',');
        next.dayTime = payload.time ?? '09:00';
      }
      setScheduleId(schedule.id);
    }

    setForm(next);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load().catch((error) => {
      Alert.alert('Load failed', error instanceof Error ? error.message : 'Unable to load medication.');
      router.back();
    });
  }, [load]);

  const onSave = async () => {
    if (!id) return;
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Medication name is required.');
      return;
    }

    try {
      setSaving(true);
      await updateMedication(id, {
        name: form.name.trim(),
        dosage: form.dosage.trim() || null,
        form: form.form,
        instructions: form.instructions.trim() || null,
        doctorContact: form.doctorContact.trim() || null,
        pharmacyContact: form.pharmacyContact.trim() || null,
        missedDoseGuidance: form.missedDoseGuidance.trim() || null
      });

      if (scheduleId) {
        await updateSchedule(scheduleId, {
          type: form.scheduleType,
          payload: payloadFromState(form)
        });
      }

      await setMedicationWarningTags(id, form.warningTags);
      await resyncMedication(db, id);
      Alert.alert('Saved', 'Medication updated.');
      router.replace(`/meds/${id}`);
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Unable to save medication.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 16 }}>
        <AppCard>
          <Text style={{ color: '#64748B' }}>Loading medication...</Text>
        </AppCard>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 28 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A' }}>Edit Medication</Text>
      <AppCard>
        <MedicationForm value={form} onChange={setForm} />
      </AppCard>
      <AppButton label={saving ? 'Saving...' : 'Save Changes'} disabled={saving} onPress={onSave} />
    </ScrollView>
  );
}
