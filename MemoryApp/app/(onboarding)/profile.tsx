import { useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { AppButton } from '@/components/core/AppButton';
import { AppCard } from '@/components/core/AppCard';
import { FormField } from '@/components/core/FormField';
import { upsertPrimaryUser } from '@/lib/db/queries';

export default function OnboardingProfileScreen() {
  const [displayName, setDisplayName] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [saving, setSaving] = useState(false);

  const saveProfile = async () => {
    try {
      setSaving(true);
      const permission = await Notifications.getPermissionsAsync();
      await upsertPrimaryUser({
        displayName: displayName.trim() || null,
        emergencyContact: emergencyContact.trim() || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notificationsEnabled: permission.granted ? 1 : 0
      });
      router.push('/(onboarding)/finish');
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8FAFC' }} contentContainerStyle={{ padding: 18, gap: 14 }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: '#0F172A' }}>Profile Setup</Text>
      <Text style={{ color: '#475569' }}>These fields are optional and can be edited later in Profile.</Text>

      <AppCard>
        <FormField label="Display Name" value={displayName} onChangeText={setDisplayName} placeholder="Your name" />
        <FormField label="Emergency Contact" value={emergencyContact} onChangeText={setEmergencyContact} placeholder="Phone or contact person" />
      </AppCard>

      <AppButton label={saving ? 'Saving...' : 'Continue'} disabled={saving} onPress={saveProfile} />
    </ScrollView>
  );
}
