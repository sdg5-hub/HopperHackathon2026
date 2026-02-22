import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AppCard } from '@/components/core/AppCard';
import { FilterChipsRow } from '@/components/core/FilterChipsRow';
import { StatusChip, type DoseDisplayStatus } from '@/components/core/StatusChip';
import { listHistoryDoseRows } from '@/lib/app/data';
import { listMedications } from '@/lib/db/queries';
import { AppButton } from '@/components/core/AppButton';
import { router } from 'expo-router';

type RangePreset = '7d' | '30d' | 'custom';

function parseISODateInput(value: string): number | null {
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0).getTime();
}

export default function HistoryTabScreen() {
  const [filterMedicationId, setFilterMedicationId] = useState<string>('all');
  const [rangePreset, setRangePreset] = useState<RangePreset>('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listHistoryDoseRows>>>([]);
  const [medications, setMedications] = useState<Array<{ id: string; name: string }>>([]);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    const meds = await listMedications(false);
    setMedications(meds.map((m) => ({ id: m.id, name: m.name })));
    const medId = filterMedicationId === 'all' ? undefined : filterMedicationId;
    const baseRows = await listHistoryDoseRows(medId);
    setRows(baseRows);
  }, [filterMedicationId]);

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => {
        console.warn('[history] load failed', error);
      });
    }, [load])
  );

  const filteredByRange = useMemo(() => {
    const now = Date.now();
    let from = now - 7 * 24 * 60 * 60 * 1000;
    let to = now;

    if (rangePreset === '30d') {
      from = now - 30 * 24 * 60 * 60 * 1000;
    }

    if (rangePreset === 'custom') {
      const customFromMs = parseISODateInput(customFrom);
      const customToMs = parseISODateInput(customTo);
      if (customFromMs != null) from = customFromMs;
      if (customToMs != null) to = customToMs + 24 * 60 * 60 * 1000 - 1;
    }

    return rows.filter((row) => row.scheduledFor >= from && row.scheduledFor <= to);
  }, [rows, rangePreset, customFrom, customTo]);

  const medOptions = useMemo(
    () => [{ key: 'all', label: 'All' }, ...medications.map((m) => ({ key: m.id, label: m.name }))],
    [medications]
  );

  const rangeOptions = useMemo(
    () => [
      { key: '7d', label: 'Last 7 days' },
      { key: '30d', label: 'Last 30 days' },
      { key: 'custom', label: 'Custom' }
    ],
    []
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC', padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A' }}>History</Text>

      <AppCard>
        <Text style={{ fontWeight: '700', color: '#0F172A' }}>Date range</Text>
        <FilterChipsRow options={rangeOptions} selectedKey={rangePreset} onSelect={(key) => setRangePreset(key as RangePreset)} />
        {rangePreset === 'custom' ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              accessibilityLabel="From date"
              placeholder="YYYY-MM-DD"
              value={customFrom}
              onChangeText={setCustomFrom}
              style={{ flex: 1, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 8, backgroundColor: '#fff' }}
            />
            <TextInput
              accessibilityLabel="To date"
              placeholder="YYYY-MM-DD"
              value={customTo}
              onChangeText={setCustomTo}
              style={{ flex: 1, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 8, backgroundColor: '#fff' }}
            />
          </View>
        ) : null}
      </AppCard>

      <AppCard>
        <Text style={{ fontWeight: '700', color: '#0F172A' }}>Medication filter</Text>
        <FilterChipsRow options={medOptions} selectedKey={filterMedicationId} onSelect={setFilterMedicationId} />
      </AppCard>

      <FlatList
        ref={listRef}
        data={filteredByRange}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 30 }}
        renderItem={({ item }) => {
          const status = (item.status === 'due' && item.scheduledFor < Date.now() - 5 * 60 * 1000 ? 'snoozed' : item.status) as DoseDisplayStatus;
          return (
            <AppCard>
              <Text style={{ color: '#0F172A', fontWeight: '700' }}>{item.medicationName}</Text>
              <Text style={{ color: '#475569' }}>
                {new Date(item.scheduledFor).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
              {item.takenAt ? (
                <Text style={{ color: '#475569' }}>
                  Taken: {new Date(item.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              ) : null}
              <StatusChip status={status} />
              {(item.status === 'missed' || item.status === 'skipped') ? (
                <AppButton label="What should I do?" tone="secondary" onPress={() => router.push({ pathname: '/missed-dose-guidance', params: { medicationId: item.medicationId } })} />
              ) : null}
            </AppCard>
          );
        }}
        ListEmptyComponent={
          <AppCard>
            <Text style={{ color: '#64748B' }}>No dose events in this range.</Text>
          </AppCard>
        }
      />
    </View>
  );
}
