import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import { AppButton } from '@/components/core/AppButton';
import { AppCard } from '@/components/core/AppCard';
import { EmptyState } from '@/components/core/EmptyState';
import { StatsCard } from '@/components/core/StatsCard';
import { StatusChip } from '@/components/core/StatusChip';
import CalendarComponent from '@/components/calendar-component';
import AddReminderForm from '@/components/add-reminder-form';
import DateCard from '@/components/date-card';
import { listTodayDoseRows } from '@/lib/app/data';
import { listDoseEventsForMedication, listMedications } from '@/lib/db/queries';
import { getNotificationDbAdapter } from '@/lib/notifications/sqlite-adapter';
import { resyncAllSchedules } from '@/lib/notifications/engine';
import { buildDailyAdherenceSeries, computeSevenDayAdherence, computeStreak, computeTrendHint } from '@/lib/app/adherence';
import { isDemoModeEnabled } from '@/lib/app/settings';
import type { Reminder } from '@/types';
import { useTheme } from '@/theme';

const db = getNotificationDbAdapter();

function getBucket(hour: number): 'Morning' | 'Afternoon' | 'Evening' {
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

export default function HomeTabScreen() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dueNowCount, setDueNowCount] = useState(0);
  const [timeline, setTimeline] = useState<Array<{ key: string; label: string; subtitle: string; bucket: string; status: string }>>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [sevenDayPct, setSevenDayPct] = useState(0);
  const [trendHint, setTrendHint] = useState('Trend unavailable yet.');
  const [demoEnabled, setDemoEnabled] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [calendarReminders, setCalendarReminders] = useState<Record<string, Reminder[]>>({
    '2026-02-21': [
      { time: '08:30 AM', text: 'Take medicine' },
      { time: '12:00 PM', text: 'Call caregiver' },
    ],
    '2026-02-22': [
      { time: '10:00 AM', text: 'Walk in park' },
      { time: '03:30 PM', text: 'Drink water' },
    ],
  });

  const handleAddReminder = useCallback((date: string, reminder: Reminder) => {
    setCalendarReminders((prev) => {
      const next = { ...prev };
      const existing = next[date] ?? [];
      next[date] = [...existing, reminder];
      return next;
    });
  }, []);

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
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[3], paddingBottom: 28 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onResync} />}
    >
      <AppCard style={{ backgroundColor: theme.colors.surface, gap: theme.spacing[2] }}>
        <Text style={{ ...theme.typography.caption, color: theme.colors.mutedText }}>
          {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <Text style={{ ...theme.typography.title, color: theme.colors.text }}>Welcome back</Text>
        <Text style={{ ...theme.typography.body, color: theme.colors.mutedText }}>Track doses, keep momentum, and stay on schedule.</Text>
      </AppCard>

      {demoEnabled ? (
        <AppCard style={{ backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.accent }}>
          <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Demo loaded. Open History to filter by meds and show outcomes.</Text>
        </AppCard>
      ) : null}

      <StatsCard streakDays={streakDays} sevenDayAdherencePct={sevenDayPct} trendHint={trendHint} />

      {dueNowCount > 0 ? (
        <AppCard style={{ borderColor: '#F59E0B', backgroundColor: '#FFFBEB', gap: theme.spacing[3] }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#92400E' }}>Due Now</Text>
          <Text style={{ color: '#92400E' }}>{dueNowCount} dose(s) need action.</Text>
          <AppButton label="View Dose History" onPress={() => router.push('/(tabs)/history')} />
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
          <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text }}>Today Timeline</Text>
          {timelineByBucket.map(([bucket, items]) => (
            <View key={bucket} style={{ gap: 6 }}>
              <Text style={{ color: theme.colors.mutedText, fontWeight: '700' }}>{bucket}</Text>
              {items.map((item) => (
                <Pressable
                  key={item.key}
                  style={({ pressed }) => ({
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                    paddingTop: 10,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{item.label}</Text>
                      <Text style={{ color: theme.colors.mutedText }}>{item.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.mutedText} />
                  </View>
                  <StatusChip status={(item.status as any) || 'due'} />
                </Pressable>
              ))}
            </View>
          ))}
        </AppCard>
      )}

      <AppCard>
        <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text }}>Personal Calendar</Text>
        <CalendarComponent reminders={calendarReminders} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        {selectedDate ? (
          <>
            <AddReminderForm selectedDate={selectedDate} onAddReminder={handleAddReminder} />
            <DateCard date={selectedDate} reminders={calendarReminders[selectedDate] || []} />
          </>
        ) : (
          <Text style={{ color: theme.colors.mutedText }}>Tap a day to add or view reminders.</Text>
        )}
      </AppCard>
    </ScrollView>
  );
}
