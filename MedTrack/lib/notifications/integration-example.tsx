import { useEffect } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { initNotifications, resyncAllSchedules } from './engine';
import { useRxDueModal } from './hooks';
import type { RxNotificationDbAdapter } from './types';

export function RxNotificationBootstrap({ db }: { db: RxNotificationDbAdapter }) {
  const due = useRxDueModal(db);

  useEffect(() => {
    (async () => {
      await initNotifications();
      await resyncAllSchedules(db);
    })().catch((error) => {
      console.warn('[notifications] bootstrap failed', error);
    });
  }, [db]);

  return (
    <Modal visible={Boolean(due.dueDose)} transparent animationType="slide" onRequestClose={due.close}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}>
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, gap: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: '700' }}>Dose Due Now</Text>
          <Text>Dose event: {due.dueDose?.id}</Text>

          <Pressable onPress={due.markTaken} style={{ backgroundColor: '#0F766E', padding: 12, borderRadius: 10, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Taken</Text>
          </Pressable>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={() => due.snooze(10)} style={buttonStyle}><Text>Snooze 10</Text></Pressable>
            <Pressable onPress={() => due.snooze(30)} style={buttonStyle}><Text>Snooze 30</Text></Pressable>
            <Pressable onPress={() => due.snooze(60)} style={buttonStyle}><Text>Snooze 60</Text></Pressable>
          </View>

          <Pressable onPress={due.markSkipped} style={{ backgroundColor: '#DC2626', padding: 12, borderRadius: 10, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Skip</Text>
          </Pressable>

          <Pressable onPress={due.close} style={{ alignItems: 'center', padding: 10 }}>
            <Text style={{ color: '#475569' }}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const buttonStyle = {
  flex: 1,
  borderWidth: 1,
  borderColor: '#CBD5E1',
  borderRadius: 10,
  padding: 10,
  alignItems: 'center',
  backgroundColor: '#F8FAFC'
} as const;
