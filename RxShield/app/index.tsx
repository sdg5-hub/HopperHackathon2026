import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { initDb, seedDemoData } from '../lib/db';
import { listMedications } from '../lib/db/queries';

export default function HomeScreen() {
  const [status, setStatus] = useState('Tap initialize to run DB setup.');
  const [medCount, setMedCount] = useState<number | null>(null);

  const runSetup = useCallback(async () => {
    try {
      setStatus('Initializing database...');
      await initDb();
      await seedDemoData();
      const medications = await listMedications();
      setMedCount(medications.length);
      setStatus('DB ready. Demo seed loaded.');
      console.log('[RxShield] medications:', medications);
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      setStatus(`DB error: ${text}`);
      console.error('[RxShield] DB error', error);
    }
  }, []);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, gap: 16, backgroundColor: '#F8FAFC' }}>
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#0F172A' }}>RxShield</Text>
        <Text style={{ color: '#475569' }}>
          Router-compatible bootstrap screen. This confirms local SQLite storage works before merging with MemoryApp.
        </Text>
      </View>

      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 }}>
        <Text style={{ color: '#0F172A', fontWeight: '600' }}>Status</Text>
        <Text style={{ color: '#334155' }}>{status}</Text>
        <Text style={{ color: '#334155' }}>Medication records: {medCount ?? '-'}</Text>

        <Pressable
          onPress={runSetup}
          style={{
            backgroundColor: '#0F766E',
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: 'center'
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Initialize + Seed Demo</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
