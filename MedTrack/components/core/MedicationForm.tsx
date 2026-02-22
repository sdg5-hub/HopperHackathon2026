import { Text, View } from 'react-native';
import { Chip } from './Chip';
import { FormField } from './FormField';
import type { MedicationForm as MedicationFormType, ScheduleType } from '@/lib/db/types';

const forms: MedicationFormType[] = ['pill', 'liquid', 'injection', 'other'];
const scheduleTypes: ScheduleType[] = ['fixed_times', 'every_x_hours', 'days_of_week', 'prn'];
const warningOptions = ['with_food', 'avoid_alcohol', 'avoid_grapefruit', 'may_cause_drowsiness', 'do_not_drive', 'take_with_water'];

type MedicationFormState = {
  name: string;
  dosage: string;
  form: MedicationFormType;
  instructions: string;
  doctorContact: string;
  pharmacyContact: string;
  missedDoseGuidance: string;
  scheduleType: ScheduleType;
  fixedTimes: string;
  intervalHours: string;
  intervalStart: string;
  daysOfWeek: string;
  dayTime: string;
  warningTags: string[];
};

type Props = {
  value: MedicationFormState;
  onChange: (next: MedicationFormState) => void;
};

export function MedicationForm({ value, onChange }: Props) {
  const set = <K extends keyof MedicationFormState>(key: K, next: MedicationFormState[K]) => {
    onChange({ ...value, [key]: next });
  };

  const toggleWarning = (tag: string) => {
    if (value.warningTags.includes(tag)) {
      set(
        'warningTags',
        value.warningTags.filter((item) => item !== tag)
      );
      return;
    }
    set('warningTags', [...value.warningTags, tag]);
  };

  return (
    <View style={{ gap: 10 }}>
      <FormField label="Medication Name *" value={value.name} onChangeText={(v) => set('name', v)} placeholder="e.g. Lisinopril" />
      <FormField label="Dosage" value={value.dosage} onChangeText={(v) => set('dosage', v)} placeholder="e.g. 10 mg" />

      <Text style={{ color: '#334155', fontWeight: '600' }}>Form</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {forms.map((f) => (
          <Chip key={f} label={f} selected={value.form === f} onPress={() => set('form', f)} />
        ))}
      </View>

      <FormField label="Instructions" value={value.instructions} onChangeText={(v) => set('instructions', v)} placeholder="Take with food" />
      <FormField label="Doctor Contact" value={value.doctorContact} onChangeText={(v) => set('doctorContact', v)} />
      <FormField label="Pharmacy Contact" value={value.pharmacyContact} onChangeText={(v) => set('pharmacyContact', v)} />
      <FormField
        label="Missed Dose Guidance"
        value={value.missedDoseGuidance}
        onChangeText={(v) => set('missedDoseGuidance', v)}
        multiline
      />

      <Text style={{ color: '#334155', fontWeight: '600' }}>Schedule Type</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {scheduleTypes.map((type) => (
          <Chip key={type} label={type} selected={value.scheduleType === type} onPress={() => set('scheduleType', type)} />
        ))}
      </View>

      {value.scheduleType === 'fixed_times' ? (
        <FormField
          label="Fixed Times (CSV)"
          value={value.fixedTimes}
          onChangeText={(v) => set('fixedTimes', v)}
          placeholder="09:00, 21:00"
        />
      ) : null}

      {value.scheduleType === 'every_x_hours' ? (
        <>
          <FormField label="Every X Hours" value={value.intervalHours} onChangeText={(v) => set('intervalHours', v)} keyboardType="number-pad" />
          <FormField label="Start Time" value={value.intervalStart} onChangeText={(v) => set('intervalStart', v)} placeholder="07:00" />
        </>
      ) : null}

      {value.scheduleType === 'days_of_week' ? (
        <>
          <FormField
            label="Days of Week (0-6 CSV)"
            value={value.daysOfWeek}
            onChangeText={(v) => set('daysOfWeek', v)}
            placeholder="1,3,5"
          />
          <FormField label="Time" value={value.dayTime} onChangeText={(v) => set('dayTime', v)} placeholder="09:00" />
        </>
      ) : null}

      <Text style={{ color: '#334155', fontWeight: '600' }}>Warning Tags</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {warningOptions.map((tag) => (
          <Chip key={tag} label={tag} selected={value.warningTags.includes(tag)} onPress={() => toggleWarning(tag)} />
        ))}
      </View>
    </View>
  );
}

export function createDefaultMedicationFormState(): MedicationFormState {
  return {
    name: '',
    dosage: '',
    form: 'pill',
    instructions: '',
    doctorContact: '',
    pharmacyContact: '',
    missedDoseGuidance: 'If close to your next dose, skip. Never double dose unless instructed by your clinician.',
    scheduleType: 'fixed_times',
    fixedTimes: '09:00,21:00',
    intervalHours: '8',
    intervalStart: '07:00',
    daysOfWeek: '1,3,5',
    dayTime: '09:00',
    warningTags: []
  };
}

export type { MedicationFormState };
