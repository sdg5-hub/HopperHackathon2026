import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import {
  createMedication,
  createSchedule,
  getPrimaryUser,
  setMedicationWarningTags
} from '@/lib/db/queries';
import type { MedicationForm, ScheduleType } from '@/lib/db/types';

const forms: MedicationForm[] = ['pill', 'liquid', 'injection', 'other'];
const scheduleTypes: ScheduleType[] = ['fixed_times', 'every_x_hours', 'days_of_week', 'prn'];
const warningOptions = ['with_food', 'avoid_alcohol', 'avoid_grapefruit', 'may_cause_drowsiness', 'do_not_drive', 'take_with_water'];

export default function AddMedicationScreen() {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [form, setForm] = useState<MedicationForm>('pill');
  const [instructions, setInstructions] = useState('');
  const [doctorContact, setDoctorContact] = useState('');
  const [pharmacyContact, setPharmacyContact] = useState('');
  const [guidance, setGuidance] = useState('If close to your next dose, skip. Never double dose unless instructed by your clinician.');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('fixed_times');
  const [fixedTimes, setFixedTimes] = useState('09:00,21:00');
  const [intervalHours, setIntervalHours] = useState('8');
  const [intervalStart, setIntervalStart] = useState('07:00');
  const [days, setDays] = useState('1,3,5');
  const [dayTime, setDayTime] = useState('09:00');
  const [startDate, setStartDate] = useState(String(Date.now()));
  const [endDate, setEndDate] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  const toggleWarning = (item: string) => {
    setWarnings((prev) => (prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]));
  };

  const save = async () => {
    try {
      if (!name.trim()) {
        Alert.alert('Validation', 'Medication name is required.');
        return;
      }

      const user = await getPrimaryUser();
      const medication = await createMedication({
        userId: user?.id ?? null,
        name: name.trim(),
        dosage: dosage.trim() || null,
        form,
        instructions: instructions.trim() || null,
        doctorContact: doctorContact.trim() || null,
        pharmacyContact: pharmacyContact.trim() || null,
        missedDoseGuidance: guidance.trim() || null,
        startDate: Number(startDate) || Date.now(),
        endDate: endDate ? Number(endDate) : null,
        isActive: 1
      });

      let payload: Record<string, unknown> = { notes: 'as needed' };
      if (scheduleType === 'fixed_times') {
        payload = { times: fixedTimes.split(',').map((s) => s.trim()).filter(Boolean) };
      } else if (scheduleType === 'every_x_hours') {
        payload = { intervalHours: Number(intervalHours) || 8, startTime: intervalStart };
      } else if (scheduleType === 'days_of_week') {
        payload = { days: days.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n)), time: dayTime };
      }

      await createSchedule(medication.id, scheduleType, payload as any, Intl.DateTimeFormat().resolvedOptions().timeZone);
      await setMedicationWarningTags(medication.id, warnings);

      router.replace({ pathname: '/medications/[id]', params: { id: medication.id } });
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 16, gap: 10 }}>
      <TextInput placeholder="Medication name *" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Dosage (e.g. 10 mg)" value={dosage} onChangeText={setDosage} style={styles.input} />

      <Text style={styles.label}>Form</Text>
      <View style={styles.rowWrap}>{forms.map((f) => <Pressable key={f} onPress={() => setForm(f)} style={[styles.chip, form === f && styles.chipActive]}><Text>{f}</Text></Pressable>)}</View>

      <TextInput placeholder="Instructions" value={instructions} onChangeText={setInstructions} style={styles.input} />
      <TextInput placeholder="Doctor contact" value={doctorContact} onChangeText={setDoctorContact} style={styles.input} />
      <TextInput placeholder="Pharmacy contact" value={pharmacyContact} onChangeText={setPharmacyContact} style={styles.input} />
      <TextInput placeholder="Missed dose guidance" value={guidance} onChangeText={setGuidance} multiline style={[styles.input, { minHeight: 80 }]} />

      <Text style={styles.label}>Schedule type</Text>
      <View style={styles.rowWrap}>{scheduleTypes.map((s) => <Pressable key={s} onPress={() => setScheduleType(s)} style={[styles.chip, scheduleType === s && styles.chipActive]}><Text>{s}</Text></Pressable>)}</View>

      {scheduleType === 'fixed_times' ? <TextInput placeholder="Times CSV (09:00,21:00)" value={fixedTimes} onChangeText={setFixedTimes} style={styles.input} /> : null}
      {scheduleType === 'every_x_hours' ? (
        <>
          <TextInput placeholder="Interval hours" value={intervalHours} onChangeText={setIntervalHours} style={styles.input} />
          <TextInput placeholder="Start time (07:00)" value={intervalStart} onChangeText={setIntervalStart} style={styles.input} />
        </>
      ) : null}
      {scheduleType === 'days_of_week' ? (
        <>
          <TextInput placeholder="Days CSV (1,3,5)" value={days} onChangeText={setDays} style={styles.input} />
          <TextInput placeholder="Time (09:00)" value={dayTime} onChangeText={setDayTime} style={styles.input} />
        </>
      ) : null}

      <TextInput placeholder="Start date unix ms" value={startDate} onChangeText={setStartDate} style={styles.input} />
      <TextInput placeholder="End date unix ms (optional)" value={endDate} onChangeText={setEndDate} style={styles.input} />

      <Text style={styles.label}>Warning tags</Text>
      <View style={styles.rowWrap}>
        {warningOptions.map((item) => (
          <Pressable key={item} onPress={() => toggleWarning(item)} style={[styles.chip, warnings.includes(item) && styles.chipActive]}>
            <Text>{item}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={save} style={styles.saveBtn}><Text style={{ color: '#fff', fontWeight: '700' }}>Save Medication</Text></Pressable>
    </ScrollView>
  );
}

const styles = {
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fff'
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 99,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#fff'
  },
  chipActive: {
    borderColor: '#0F766E',
    backgroundColor: '#CCFBF1'
  },
  label: {
    color: '#334155',
    fontWeight: '600'
  },
  saveBtn: {
    backgroundColor: '#0F766E',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8
  }
};
