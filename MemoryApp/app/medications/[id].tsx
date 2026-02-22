import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, router } from 'expo-router';
import {
  deleteMedication,
  getMedicationById,
  getMedicationWarningTags,
  listSchedulesForMedication,
  setMedicationWarningTags,
  updateMedication
} from '@/lib/db/queries';
import type { Medication, Schedule } from '@/lib/db/types';

function nextDoseText(schedule: Schedule | null): string {
  if (!schedule) return 'No schedule';
  try {
    const payload = JSON.parse(schedule.payloadJson) as Record<string, any>;
    if (schedule.type === 'fixed_times') return `Next at one of: ${(payload.times || []).join(', ')}`;
    if (schedule.type === 'every_x_hours') return `Every ${payload.intervalHours}h from ${payload.startTime}`;
    if (schedule.type === 'days_of_week') return `Days ${(payload.days || []).join(',')} at ${payload.time}`;
    return 'PRN / as needed';
  } catch {
    return 'Schedule data unavailable';
  }
}

export default function MedicationDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [medication, setMedication] = useState<Medication | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [guidance, setGuidance] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const med = await getMedicationById(id);
    if (!med) {
      Alert.alert('Not found', 'Medication no longer exists.');
      router.back();
      return;
    }
    const schedules = await listSchedulesForMedication(id);
    const warningTags = await getMedicationWarningTags(id);

    setMedication(med);
    setSchedule(schedules[0] ?? null);
    setTags(warningTags);
    setName(med.name);
    setDosage(med.dosage ?? '');
    setInstructions(med.instructions ?? '');
    setGuidance(med.missedDoseGuidance ?? '');
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => Alert.alert('Load failed', error instanceof Error ? error.message : String(error)));
    }, [load])
  );

  const save = async () => {
    if (!medication) return;
    try {
      await updateMedication(medication.id, {
        name: name.trim() || medication.name,
        dosage: dosage.trim() || null,
        instructions: instructions.trim() || null,
        missedDoseGuidance: guidance
      });
      await setMedicationWarningTags(medication.id, tags);
      Alert.alert('Saved', 'Medication updated.');
      await load();
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : String(error));
    }
  };

  const remove = () => {
    if (!medication) return;
    Alert.alert('Delete medication?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteMedication(medication.id)
            .then(() => router.replace('/medications'))
            .catch((error) => Alert.alert('Delete failed', error instanceof Error ? error.message : String(error)));
        }
      }
    ]);
  };

  if (!medication) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, gap: 8 }}>
        <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 18 }}>{medication.name}</Text>
        <Text style={{ color: '#475569' }}>{medication.dosage || 'No dosage'} • {medication.form || 'no form'}</Text>
        <Text style={{ color: '#334155' }}>{nextDoseText(schedule)}</Text>
        <Text style={{ color: '#B91C1C', fontWeight: '600' }}>Not exhaustive—confirm with pharmacist.</Text>
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, gap: 8 }}>
        <Text style={{ color: '#334155', fontWeight: '600' }}>Edit Core Details</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Medication name" style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 10, backgroundColor: '#fff' }} />
        <TextInput value={dosage} onChangeText={setDosage} placeholder="Dosage" style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 10, backgroundColor: '#fff' }} />
        <TextInput value={instructions} onChangeText={setInstructions} placeholder="Instructions" style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 10, backgroundColor: '#fff' }} />
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, gap: 8 }}>
        <Text style={{ color: '#334155', fontWeight: '600' }}>Warning tags</Text>
        <Text style={{ color: '#475569' }}>{tags.length ? tags.join(', ') : 'No warning tags set'}</Text>
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, gap: 8 }}>
        <Text style={{ color: '#334155', fontWeight: '600' }}>Missed dose guidance</Text>
        <TextInput value={guidance} onChangeText={setGuidance} multiline style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 10, minHeight: 90, backgroundColor: '#fff' }} />
      </View>

      <Pressable onPress={save} style={{ backgroundColor: '#0F766E', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Save Changes</Text>
      </Pressable>

      <Pressable onPress={remove} style={{ backgroundColor: '#DC2626', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Delete Medication</Text>
      </Pressable>
    </ScrollView>
  );
}
