import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { initDb, seedDemoData } from './lib/db';
import { listMedications } from './lib/db/queries';

export default function App() {
  const [msg, setMsg] = useState('Running DB test...');

  useEffect(() => {
    (async () => {
      await initDb();
      await seedDemoData();
      const meds = await listMedications();
      setMsg(`DB OK. Medications: ${meds.length}`);
      console.log('[RxShield] medications:', meds);
    })().catch((e) => {
      setMsg(`DB Error: ${String(e)}`);
      console.error(e);
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <Text style={{ color: '#111827', fontSize: 18, textAlign: 'center' }}>{msg}</Text>
    </View>
  );
}