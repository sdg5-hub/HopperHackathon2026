import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router } from 'expo-router';
import { initDb } from '@/lib/db';
import { initNotifications, resyncAllSchedules } from '@/lib/notifications/engine';
import { getNotificationDbAdapter } from '@/lib/notifications/sqlite-adapter';
import { isOnboardingComplete, isSafetyAcknowledged, shouldReshowSafetyOnLaunch, isDemoModeEnabled } from '@/lib/app/settings';
import { runReliabilitySweep } from '@/lib/notifications/reliability';
import { loadDemoDataAndNearReminder } from '@/lib/app/demo';

export default function LaunchGateScreen() {
  const [status, setStatus] = useState('Starting MedTrack...');

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setStatus('Initializing local database...');
        await initDb();

        setStatus('Loading demo data...');
        const demoEnabled = await isDemoModeEnabled();
        if (demoEnabled) {
          await loadDemoDataAndNearReminder();
        }

        setStatus('Preparing notifications...');
        await initNotifications();

        const onboardingDone = await isOnboardingComplete();
        if (!onboardingDone) {
          if (alive) router.replace('/(onboarding)');
          return;
        }

        const db = getNotificationDbAdapter();
        setStatus('Syncing reminders...');
        await resyncAllSchedules(db);
        await runReliabilitySweep(db);

        const safetyAck = await isSafetyAcknowledged();
        const forceShowSafety = await shouldReshowSafetyOnLaunch();
        if (!safetyAck || forceShowSafety) {
          if (alive) router.replace({ pathname: '/safety-check', params: { returnTo: '/(tabs)' } });
          return;
        }

        if (alive) router.replace('/(tabs)');
      } catch (error) {
        if (alive) {
          setStatus(error instanceof Error ? error.message : 'Failed to initialize app.');
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
      <ActivityIndicator size="large" color="#0F766E" />
      <Text style={{ color: '#0F172A', fontSize: 20, fontWeight: '700' }}>MedTrack</Text>
      <Text style={{ color: '#475569', textAlign: 'center' }}>{status}</Text>
    </View>
  );
}
