import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { deleteMedication, listMedications } from '@/lib/db/queries';
import type { Medication } from '@/lib/db/types';

export default function MedicationsScreen() {
  const [items, setItems] = useState<Medication[]>([]);

  const load = useCallback(async () => {
    const meds = await listMedications(false);
    setItems(meds);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => {
        Alert.alert('Load failed', error instanceof Error ? error.message : String(error));
      });
    }, [load])
  );

  const onDelete = (id: string) => {
    Alert.alert('Delete medication?', 'This will remove schedules and dose logs.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteMedication(id)
            .then(load)
            .catch((error) => Alert.alert('Delete failed', error instanceof Error ? error.message : String(error)));
        }
      }
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Link href="/medications/new" asChild>
        <Pressable style={{ backgroundColor: '#0F766E', borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Add Medication</Text>
        </Pressable>
      </Link>

      {items.length === 0 ? (
        <View style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 12 }}>
          <Text style={{ color: '#475569' }}>No medications yet. Add one to begin reminders and logs.</Text>
        </View>
      ) : null}

      {items.map((med) => (
        <View key={med.id} style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, gap: 8 }}>
          <Text style={{ color: '#0F172A', fontWeight: '700', fontSize: 16 }}>{med.name}</Text>
          <Text style={{ color: '#475569' }}>{med.dosage || 'No dosage'} • {med.form || 'form not set'}</Text>
          <Text style={{ color: med.isActive ? '#15803D' : '#B91C1C', fontWeight: '600' }}>{med.isActive ? 'Active' : 'Inactive'}</Text>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Link href={{ pathname: '/medications/[id]', params: { id: med.id } }} asChild>
              <Pressable style={{ flex: 1, backgroundColor: '#0EA5E9', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>View / Edit</Text>
              </Pressable>
            </Link>
            <Pressable onPress={() => onDelete(med.id)} style={{ flex: 1, backgroundColor: '#DC2626', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
