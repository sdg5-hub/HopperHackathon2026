import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { AppButton } from '@/components/core/AppButton';
import { AppCard } from '@/components/core/AppCard';
import { Chip } from '@/components/core/Chip';
import { EmptyState } from '@/components/core/EmptyState';
import { listMedicationsWithMeta } from '@/lib/app/data';

export default function MedsTabScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Awaited<ReturnType<typeof listMedicationsWithMeta>>>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setItems(await listMedicationsWithMeta());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => {
        console.warn('[meds] load failed', error);
        setLoading(false);
      });
    }, [load])
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 28 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A' }}>Medications</Text>
        <AppButton label="+ Add" onPress={() => router.push('/meds/new')} style={{ paddingHorizontal: 12 }} />
      </View>

      {loading ? (
        <AppCard>
          <Text style={{ color: '#64748B' }}>Loading medications...</Text>
        </AppCard>
      ) : items.length === 0 ? (
        <EmptyState
          title="Add your first medication"
          description="Create a schedule to activate local reminders and dose logs."
          ctaLabel="Add Medication"
          onPressCta={() => router.push('/meds/new')}
        />
      ) : (
        items.map((item) => (
          <AppCard key={item.medication.id}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#0F172A' }}>{item.medication.name}</Text>
            <Text style={{ color: '#475569' }}>{item.medication.dosage ?? 'Dosage not set'}</Text>
            <Text style={{ color: item.medication.isActive ? '#15803D' : '#B91C1C' }}>
              {item.medication.isActive ? 'Active' : 'Inactive'}
            </Text>
            <Text style={{ color: '#334155' }}>
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
              {item.warningTags.slice(0, 3).map((tag) => (
                <Chip key={tag} label={tag} />
              ))}
            </View>
            <AppButton label="Open" tone="secondary" onPress={() => router.push(`/meds/${item.medication.id}`)} />
          </AppCard>
        ))
      )}
    </ScrollView>
  );
}
