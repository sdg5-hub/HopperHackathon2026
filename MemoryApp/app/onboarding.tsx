import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { initDb } from '@/lib/db';
import { getPrimaryUser, upsertPrimaryUser } from '@/lib/db/queries';

export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      await initDb();
      const user = await getPrimaryUser();
      if (user?.displayName) {
        setName(user.displayName);
      }
    })().catch(() => {
      // ignore autofill errors
    });
  }, []);

  const onContinue = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please add your name to continue.');
      return;
    }

    try {
      setSaving(true);
      await initDb();
      const perm = await Notifications.requestPermissionsAsync();
      const granted = perm.granted ? 1 : 0;

      await upsertPrimaryUser({
        displayName: name.trim(),
        timezone,
        notificationsEnabled: granted
      });

      Alert.alert('Saved', 'Onboarding completed.');
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save onboarding.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, gap: 8 }}>
        <Text style={{ fontWeight: '700', color: '#0F172A', fontSize: 18 }}>Safety Notice</Text>
        <Text style={{ color: '#475569' }}>
          This app is not medical advice. In emergencies call your local emergency services.
        </Text>
        <Text style={{ color: '#475569' }}>
          Privacy: your data is stored locally on this device. Export/share is optional.
        </Text>
      </View>

      <View style={{ backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, gap: 8 }}>
        <Text style={{ color: '#334155', fontWeight: '600' }}>Your name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter name"
          style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 10, backgroundColor: '#fff' }}
        />

        <Text style={{ color: '#334155', fontWeight: '600' }}>Timezone</Text>
        <Text style={{ color: '#475569' }}>{timezone}</Text>

        <Pressable
          onPress={onContinue}
          disabled={saving}
          style={{ backgroundColor: '#0F766E', borderRadius: 10, paddingVertical: 12, alignItems: 'center', opacity: saving ? 0.7 : 1 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>{saving ? 'Saving...' : 'Save & Request Notifications'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
