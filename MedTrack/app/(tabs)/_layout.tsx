import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { DueDoseModal } from '@/components/core/DueDoseModal';
import { useRxDueModal } from '@/lib/notifications/hooks';
import { getNotificationDbAdapter } from '@/lib/notifications/sqlite-adapter';
import { getMedicationById, getMedicationWarningTags } from '@/lib/db/queries';
import { runReliabilitySweep } from '@/lib/notifications/reliability';
import { useTheme } from '@/theme';

const db = getNotificationDbAdapter();

export default function TabsLayout() {
  const theme = useTheme();
  const due = useRxDueModal(db);
  const [medicationName, setMedicationName] = useState<string | undefined>();
  const [dosage, setDosage] = useState<string | undefined>();
  const [instructions, setInstructions] = useState<string | undefined>();
  const [warningTags, setWarningTags] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      if (!due.dueDose) {
        setMedicationName(undefined);
        setDosage(undefined);
        setInstructions(undefined);
        setWarningTags([]);
        return;
      }

      const medication = await getMedicationById(due.dueDose.medication_id);
      if (!medication) return;

      setMedicationName(medication.name);
      setDosage(medication.dosage ?? undefined);
      setInstructions(medication.instructions ?? undefined);
      setWarningTags(await getMedicationWarningTags(medication.id));
    })().catch((error) => {
      console.warn('[tabs] failed to load due dose details', error);
    });
  }, [due.dueDose]);

  useEffect(() => {
    const runSweep = () => {
      runReliabilitySweep(db).catch((error) => {
        console.warn('[reliability] sweep failed', error);
      });
    };

    runSweep();
    const interval = setInterval(runSweep, 60 * 1000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') runSweep();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTitleStyle: { color: theme.colors.text, fontWeight: '700' },
          headerShadowVisible: false,
          tabBarActiveTintColor: theme.colors.accent,
          tabBarInactiveTintColor: theme.colors.mutedText,
          tabBarStyle: {
            height: 64,
            paddingBottom: 10,
            paddingTop: 8,
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
          }
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerRight: () => (
              <Ionicons
                name="alert-circle-outline"
                size={theme.icon.lg}
                color={theme.colors.accent}
                style={{ marginRight: 12 }}
                accessibilityLabel="Open emergency card"
                onPress={() => router.push('/emergency-card')}
              />
            ),
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />
          }}
        />
        <Tabs.Screen
          name="meds"
          options={{
            title: 'Meds',
            tabBarIcon: ({ color, size }) => <Ionicons name="medkit-outline" color={color} size={size} />
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" color={color} size={size} />
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />
          }}
        />
      </Tabs>

      <DueDoseModal
        visible={Boolean(due.dueDose)}
        doseEvent={due.dueDose}
        medicationName={medicationName}
        dosage={dosage}
        instructions={instructions}
        warningTags={warningTags}
        onTaken={due.markTaken}
        onSkip={due.markSkipped}
        onSnooze={due.snooze}
        onClose={due.close}
      />
    </>
  );
}
