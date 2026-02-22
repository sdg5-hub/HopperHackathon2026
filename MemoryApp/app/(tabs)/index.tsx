import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { AppButton } from '@/components/core/AppButton';
import { AppCard } from '@/components/core/AppCard';
import { EmptyState } from '@/components/core/EmptyState';
import { StatsCard } from '@/components/core/StatsCard';
import { StatusChip } from '@/components/core/StatusChip';
import { listTodayDoseRows } from '@/lib/app/data';
import { listDoseEventsForMedication, listMedications } from '@/lib/db/queries';
import { getNotificationDbAdapter } from '@/lib/notifications/sqlite-adapter';
import { resyncAllSchedules } from '@/lib/notifications/engine';
import { buildDailyAdherenceSeries, computeSevenDayAdherence, computeStreak, computeTrendHint } from '@/lib/app/adherence';
import { isDemoModeEnabled } from '@/lib/app/settings';

const db = getNotificationDbAdapter();

function getBucket(hour: number): 'Morning' | 'Afternoon' | 'Evening' {
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

export default function HomeTabScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dueNowCount, setDueNowCount] = useState(0);
  const [timeline, setTimeline] = useState<Array<{ key: string; label: string; subtitle: string; bucket: string; status: string }>>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [sevenDayPct, setSevenDayPct] = useState(0);
  const [trendHint, setTrendHint] = useState('Trend unavailable yet.');
  const [demoEnabled, setDemoEnabled] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const meds = await listMedications(true);
    const due = await db.listDueDoseEvents(Date.now());
    const todayRows = await listTodayDoseRows();

    setDueNowCount(due.length);
    setTimeline(
      todayRows.map((row) => {
        const date = new Date(row.scheduledFor);
        const label = `${row.medicationName}${row.dosage ? ` • ${row.dosage}` : ''}`;
        const subtitle = `${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        return {
          key: row.id,
          label,
          subtitle,
          bucket: getBucket(date.getHours()),
          status: row.status
        };
      })
    );

    const allDoseEvents = (
      await Promise.all(meds.map((med) => listDoseEventsForMedication(med.id, 500, 0)))
    ).flat();

    const now = Date.now();
    const seven = computeSevenDayAdherence(allDoseEvents as any, now);
    const daily = buildDailyAdherenceSeries(allDoseEvents as any, now);
    setSevenDayPct(seven.adherencePct);
    setStreakDays(computeStreak(daily, 80));
    setTrendHint(computeTrendHint(daily));
    setDemoEnabled(await isDemoModeEnabled());

    if (meds.length === 0) {
      setTimeline([]);
    }

    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => {
        console.warn('[home] load failed', error);
        setLoading(false);
      });
    }, [load])
  );

  const onResync = async () => {
    setRefreshing(true);
    try {
      await resyncAllSchedules(db);
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const timelineByBucket = useMemo(() => {
    const map = new Map<string, typeof timeline>();
    for (const item of timeline) {
      const list = map.get(item.bucket) ?? [];
      list.push(item);
      map.set(item.bucket, list);
    }
    return Array.from(map.entries());
  }, [timeline]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F8FAFC' }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 28 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onResync} />}
    >
      {demoEnabled ? (
        <AppCard style={{ backgroundColor: '#ECFEFF', borderColor: '#67E8F9' }}>
          <Text style={{ color: '#155E75', fontWeight: '700' }}>Demo loaded. Open History to filter by meds and show outcomes.</Text>
        </AppCard>
      ) : null}

      <StatsCard streakDays={streakDays} sevenDayAdherencePct={sevenDayPct} trendHint={trendHint} />

      {dueNowCount > 0 ? (
        <AppCard style={{ borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#92400E' }}>Due Now</Text>
          <Text style={{ color: '#92400E' }}>{dueNowCount} dose(s) need action.</Text>
        </AppCard>
      ) : null}

      <AppButton label="Resync Reminders" onPress={onResync} tone="secondary" />

      {loading ? (
        <AppCard>
          <Text style={{ color: '#64748B' }}>Loading schedule...</Text>
        </AppCard>
      ) : timeline.length === 0 ? (
        <EmptyState title="No doses scheduled today" description="Add your first medication to start reminders." ctaLabel="Add Medication" onPressCta={() => router.push('/meds/new')} />
      ) : (
        <AppCard>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>Today Timeline</Text>
          {timelineByBucket.map(([bucket, items]) => (
            <View key={bucket} style={{ gap: 6 }}>
              <Text style={{ color: '#334155', fontWeight: '700' }}>{bucket}</Text>
              {items.map((item) => (
                <View key={item.key} style={{ borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8 }}>
                  <Text style={{ color: '#0F172A', fontWeight: '600' }}>{item.label}</Text>
                  <Text style={{ color: '#475569' }}>{item.subtitle}</Text>
                  <StatusChip status={(item.status as any) || 'due'} />
                </View>
              ))}
            </View>
          ))}
        </AppCard>
      )}
    </ScrollView>
  );
}
