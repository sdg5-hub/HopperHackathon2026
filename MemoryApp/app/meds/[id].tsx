import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AppButton } from '@/components/core/AppButton';
import { AppCard } from '@/components/core/AppCard';
import { Chip } from '@/components/core/Chip';
import { describeSchedule, getMedicationDetail } from '@/lib/app/data';
import { deactivateMedication, deleteMedication } from '@/lib/db/queries';
import { cancelMedicationNotifications, resyncMedication } from '@/lib/notifications/engine';
import { getNotificationDbAdapter } from '@/lib/notifications/sqlite-adapter';

const db = getNotificationDbAdapter();

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getMedicationDetail>> | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    const data = await getMedicationDetail(id);
    setDetail(data);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => {
        Alert.alert('Load failed', error instanceof Error ? error.message : 'Unable to load medication.');
      });
    }, [load])
  );

  if (!detail) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#64748B' }}>Loading medication...</Text>
      </View>
    );
  }

  const { medication } = detail;

  const onDeactivate = async () => {
    try {
      await deactivateMedication(medication.id);
      await cancelMedicationNotifications(db, medication.id);
      Alert.alert('Deactivated', 'Medication is now inactive.');
      await load();
    } catch (error) {
      Alert.alert('Failed', error instanceof Error ? error.message : 'Unable to deactivate medication.');
    }
  };

  const onDelete = () => {
    Alert.alert('Delete medication?', 'This will remove schedules, logs, and reminders.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelMedicationNotifications(db, medication.id);
            await deleteMedication(medication.id);
            router.replace('/meds');
          } catch (error) {
            Alert.alert('Delete failed', error instanceof Error ? error.message : 'Unable to delete medication.');
          }
        }
      }
    ]);
  };

  const onResync = async () => {
    try {
      await resyncMedication(db, medication.id);
      Alert.alert('Resynced', 'Reminder schedule has been refreshed.');
    } catch (error) {
      Alert.alert('Resync failed', error instanceof Error ? error.message : 'Unable to resync reminders.');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 28 }}>
      <AppCard>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A' }}>{medication.name}</Text>
        <Text style={{ color: '#475569' }}>{medication.dosage ?? 'No dosage'} • {medication.form ?? 'No form'}</Text>
        <Text style={{ color: medication.isActive ? '#15803D' : '#B91C1C', fontWeight: '700' }}>{medication.isActive ? 'Active' : 'Inactive'}</Text>
        {medication.instructions ? <Text style={{ color: '#334155' }}>{medication.instructions}</Text> : null}
      </AppCard>

      <AppCard>
        <Text style={{ fontWeight: '700', color: '#0F172A' }}>Schedules</Text>
        {detail.schedules.length === 0 ? (
          <Text style={{ color: '#64748B' }}>No schedules</Text>
        ) : (
          detail.schedules.map((schedule) => (
            <Text key={schedule.id} style={{ color: '#475569' }}>
              - {describeSchedule(schedule)}
            </Text>
          ))
        )}
      </AppCard>

      <AppCard>
        <Text style={{ fontWeight: '700', color: '#0F172A' }}>Warning Tags</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {detail.warningTags.length ? detail.warningTags.map((tag) => <Chip key={tag} label={tag} />) : <Text style={{ color: '#64748B' }}>No tags set.</Text>}
        </View>
      </AppCard>

      <AppCard>
        <Text style={{ fontWeight: '700', color: '#0F172A' }}>Next 3 Doses</Text>
        {detail.upcomingDoses.length === 0 ? (
          <Text style={{ color: '#64748B' }}>No upcoming doses in log yet.</Text>
        ) : (
          detail.upcomingDoses.map((dose) => (
            <Text key={dose.id} style={{ color: '#475569' }}>
              {new Date(dose.scheduledFor).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </Text>
          ))
        )}
      </AppCard>

      <AppButton label="Edit" tone="secondary" onPress={() => router.push(`/meds/edit/${medication.id}`)} />
      <AppButton label="What if I missed a dose?" tone="secondary" onPress={() => router.push({ pathname: '/missed-dose-guidance', params: { medicationId: medication.id } })} />
      <AppButton label="Resync Reminders" tone="secondary" onPress={onResync} />
      <AppButton label="Deactivate" tone="danger" onPress={onDeactivate} />
      <AppButton label="Delete" tone="danger" onPress={onDelete} />
    </ScrollView>
  );
}
