import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTheme } from '@/theme';
import { AppButton } from '@/components/core/AppButton';
import { AppCard } from '@/components/core/AppCard';
import { Chip } from '@/components/core/Chip';
import { EmptyState } from '@/components/core/EmptyState';
import { listMedicationsWithMeta } from '@/lib/app/data';
import { deleteMedication } from '@/lib/db/queries';
import { cancelMedicationNotifications } from '@/lib/notifications/engine';
import { getNotificationDbAdapter } from '@/lib/notifications/sqlite-adapter';

const db = getNotificationDbAdapter();

export default function MedsListScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<Awaited<ReturnType<typeof listMedicationsWithMeta>>>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await listMedicationsWithMeta());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => {
        console.warn('[meds-list] load failed', error);
        setLoading(false);
      });
    }, [load])
  );

  const removeMedication = (id: string) => {
    Alert.alert('Delete medication?', 'This removes schedules, logs, and reminders.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelMedicationNotifications(db, id);
            await deleteMedication(id);
            await load();
          } catch (error) {
            Alert.alert('Delete failed', error instanceof Error ? error.message : 'Unable to delete medication.');
          }
        }
      }
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>
        {loading ? (
          <AppCard>
            <Text style={{ color: theme.colors.mutedText }}>Loading medications...</Text>
          </AppCard>
        ) : items.length === 0 ? (
          <EmptyState
            title="Add your first medication"
            description="Create a medication schedule to enable reminders."
            ctaLabel="Add Medication"
            onPressCta={() => router.push('/meds/new')}
          />
        ) : (
          items.map((item) => (
            <AppCard key={item.medication.id}>
              <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '700' }}>{item.medication.name}</Text>
              <Text style={{ color: theme.colors.mutedText }}>{item.medication.dosage ?? 'No dosage set'}</Text>
              <Text style={{ color: theme.colors.mutedText }}>
                Next dose:{' '}
                {item.nextDose
                  ? new Date(item.nextDose.scheduledFor).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'No scheduled dose'}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {item.warningTags.slice(0, 4).map((tag) => (
                  <Chip key={tag} label={tag} />
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <AppButton label="Details" tone="secondary" onPress={() => router.push(`/meds/${item.medication.id}`)} style={{ flex: 1 }} />
                <AppButton label="Delete" tone="danger" onPress={() => removeMedication(item.medication.id)} style={{ flex: 1 }} />
              </View>
            </AppCard>
          ))
        )}
      </ScrollView>

      <View style={{ position: 'absolute', right: 16, bottom: 16 }}>
        <AppButton label="+ Add Medication" onPress={() => router.push('/meds/new')} />
      </View>
    </View>
  );
}
