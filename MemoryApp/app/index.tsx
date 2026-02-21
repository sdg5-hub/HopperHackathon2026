import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { getPrimaryUser, listMedications } from '@/lib/db/queries';
import { initDb } from '@/lib/db';

export default function HomeScreen() {
  const [status, setStatus] = useState('Loading...');
  const [name, setName] = useState<string>('');
  const [medCount, setMedCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          await initDb();
          const user = await getPrimaryUser();
          const meds = await listMedications(true);
          if (cancelled) return;

          setName(user?.displayName ?? '');
          setMedCount(meds.length);
          if (!user) {
            setStatus('Onboarding pending. Complete safety setup first.');
          } else {
            setStatus(`Ready. ${meds.length} active medication(s).`);
          }
        } catch (error) {
          if (!cancelled) {
            setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, gap: 6 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#0F172A' }}>RxShield</Text>
        <Text style={{ color: '#475569' }}>Not medical advice. In emergencies call local services.</Text>
        <Text style={{ color: '#0F172A', fontWeight: '600' }}>{status}</Text>
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, gap: 8 }}>
        <Text style={{ color: '#0F172A', fontWeight: '700' }}>Quick Summary</Text>
        <Text style={{ color: '#475569' }}>User: {name || 'Not set'}</Text>
        <Text style={{ color: '#475569' }}>Active meds: {medCount}</Text>
      </View>

      <Link href="/onboarding" asChild>
        <Pressable style={{ backgroundColor: '#0F766E', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{name ? 'Edit Onboarding & Safety' : 'Start Onboarding'}</Text>
        </Pressable>
      </Link>

      <Link href="/medications" asChild>
        <Pressable style={{ backgroundColor: '#0EA5E9', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Open Medication Manager</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}
