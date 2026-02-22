import { useCallback, useState } from 'react';
import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useFocusEffect, router } from 'expo-router';
import { useTheme } from '@/theme';
import { AppButton } from '@/components/core/AppButton';
import { AppCard } from '@/components/core/AppCard';
import { FormField } from '@/components/core/FormField';
import { FilterChipsRow } from '@/components/core/FilterChipsRow';
import { isDemoModeEnabled, isSafetyAcknowledged, setDemoModeEnabled, setReshowSafetyOnLaunch, setSafetyAcknowledged, shouldReshowSafetyOnLaunch } from '@/lib/app/settings';
import { initDb, resetDbForDev } from '@/lib/db';
import { getPrimaryUser, upsertPrimaryUser } from '@/lib/db/queries';
import { loadDemoDataAndNearReminder, clearDemoDataOnly } from '@/lib/app/demo';
import { getAutoMissWindow, setAutoMissWindow } from '@/lib/notifications/reliability';

export default function ProfileTabScreen() {
  const theme = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [demoEnabled, setDemoEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reshowSafety, setReshowSafety] = useState(false);
  const [safetyAck, setSafetyAck] = useState(false);
  const [autoMissWindow, setAutoMissWindowState] = useState<'1h' | '2h' | '4h' | 'never'>('2h');

  const load = useCallback(async () => {
    await initDb();
    const user = await getPrimaryUser();
    setDisplayName(user?.displayName ?? '');
    setEmergencyContact(user?.emergencyContact ?? '');
    setDemoEnabled(await isDemoModeEnabled());
    setReshowSafety(await shouldReshowSafetyOnLaunch());
    setSafetyAck(await isSafetyAcknowledged());
    setAutoMissWindowState(await getAutoMissWindow());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => {
        console.warn('[profile] load failed', error);
      });
    }, [load])
  );

  const onSaveProfile = async () => {
    try {
      setSaving(true);
      await upsertPrimaryUser({
        displayName: displayName.trim() || null,
        emergencyContact: emergencyContact.trim() || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notificationsEnabled: 1
      });
      Alert.alert('Saved', 'Profile updated.');
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const onToggleDemo = async (next: boolean) => {
    try {
      setDemoEnabled(next);
      await setDemoModeEnabled(next);
      if (next) {
        await loadDemoDataAndNearReminder();
        Alert.alert('Demo loaded', 'Demo loaded. Open Home → see streak + 7-day adherence. Open History → filter by med.');
      }
    } catch (error) {
      Alert.alert('Demo mode error', error instanceof Error ? error.message : 'Failed to toggle demo mode.');
      setDemoEnabled(!next);
    }
  };

  const onClearDemo = async () => {
    try {
      await clearDemoDataOnly();
      await setDemoModeEnabled(false);
      setDemoEnabled(false);
      Alert.alert('Demo cleared', 'Demo records removed.');
    } catch (error) {
      Alert.alert('Clear failed', error instanceof Error ? error.message : 'Unable to clear demo data.');
    }
  };

  const onClearAll = () => {
    Alert.alert('Clear all local data?', 'This removes medications, schedules, logs, and settings.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await resetDbForDev();
            Alert.alert('Cleared', 'All local data has been reset.');
            await load();
          } catch (error) {
            Alert.alert('Reset failed', error instanceof Error ? error.message : 'Failed to clear data.');
          }
        }
      }
    ]);
  };

  const onResetSafetyAck = async () => {
    await setSafetyAcknowledged(false);
    setSafetyAck(false);
    Alert.alert('Reset', 'Safety Check acknowledgement was reset.');
  };

  const updateReshowSafety = async (value: boolean) => {
    setReshowSafety(value);
    await setReshowSafetyOnLaunch(value);
  };

  const onChangeWindow = async (key: string) => {
    const value = key as '1h' | '2h' | '4h' | 'never';
    setAutoMissWindowState(value);
    await setAutoMissWindow(value);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 28 }}
    >
      <AppCard>
        <Text style={{ ...theme.typography.title, color: theme.colors.text }}>Profile & Settings</Text>
        <Text style={{ ...theme.typography.body, color: theme.colors.mutedText }}>
          Personal info, safety controls, demo mode, and app behavior.
        </Text>
      </AppCard>

      <AppCard>
        <FormField label="Display Name" value={displayName} onChangeText={setDisplayName} placeholder="Name" />
        <FormField label="Emergency Contact" value={emergencyContact} onChangeText={setEmergencyContact} placeholder="Phone or person" />
        <AppButton label={saving ? 'Saving...' : 'Save Profile'} disabled={saving} onPress={onSaveProfile} />
        <AppButton label="Open Emergency Card" tone="secondary" onPress={() => router.push('/emergency-card')} />
      </AppCard>

      <AppCard>
        <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Safety Check</Text>
        <Text style={{ color: theme.colors.mutedText }}>Acknowledged: {safetyAck ? 'Yes' : 'No'}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: theme.colors.mutedText }}>Re-show Safety Check on launch</Text>
          <Switch
            value={reshowSafety}
            onValueChange={updateReshowSafety}
            trackColor={{ false: theme.colors.border, true: theme.colors.accentSoft }}
            thumbColor={reshowSafety ? theme.colors.accent : '#F8FAFC'}
          />
        </View>
        <AppButton label="Reset Safety Check acknowledgement" tone="secondary" onPress={onResetSafetyAck} />
      </AppCard>

      <AppCard>
        <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Auto-mark missed</Text>
        <Text style={{ color: theme.colors.mutedText }}>Mark overdue doses as missed after:</Text>
        <FilterChipsRow
          options={[
            { key: '1h', label: '1h' },
            { key: '2h', label: '2h' },
            { key: '4h', label: '4h' },
            { key: 'never', label: 'Never' }
          ]}
          selectedKey={autoMissWindow}
          onSelect={onChangeWindow}
        />
      </AppCard>

      <AppCard>
        <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Demo</Text>
        <Text style={{ color: theme.colors.mutedText }}>Load demo data and a near-future reminder for judge walkthrough.</Text>
        <Switch
          value={demoEnabled}
          onValueChange={onToggleDemo}
          trackColor={{ false: theme.colors.border, true: theme.colors.accentSoft }}
          thumbColor={demoEnabled ? theme.colors.accent : '#F8FAFC'}
        />
        <AppButton label="Load demo data + schedule near-future reminder" tone="secondary" onPress={() => onToggleDemo(true)} />
        <AppButton label="Clear demo data" tone="secondary" onPress={onClearDemo} />
      </AppCard>

      <AppCard>
        <Text style={{ color: theme.colors.danger, fontWeight: '700' }}>Danger Zone</Text>
        <AppButton label="Clear All Data" tone="danger" onPress={onClearAll} />
      </AppCard>

      <AppCard>
        <Text style={{ color: theme.colors.text, fontWeight: '700' }}>About</Text>
        <Text style={{ color: theme.colors.mutedText }}>Version: {Constants.expoConfig?.version ?? 'dev'}</Text>
        <Text style={{ color: theme.colors.mutedText }}>Not medical advice. Guidance is not exhaustive.</Text>
      </AppCard>
    </ScrollView>
  );
}
