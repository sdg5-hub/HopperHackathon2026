import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Clock from '@/components/clock';
import CalendarComponent from '@/components/calendar-component';
import AddReminderForm from '@/components/add-reminder-form';
import DateCard from '@/components/date-card';
import { Reminder } from '@/types';

import { initDb, seedDemoData } from '@/lib/db';
import { listMedications } from '@/lib/db/queries';

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState('');
  const [dbStatus, setDbStatus] = useState('DB not initialized yet.');
  const [reminders, setReminders] = useState<Record<string, Reminder[]>>({
    '2026-02-21': [
      { time: '08:30 AM', text: 'Take medicine' },
      { time: '12:00 PM', text: 'Call caregiver' },
    ],
    '2026-02-22': [
      { time: '10:00 AM', text: 'Walk in park' },
      { time: '03:30 PM', text: 'Drink water' },
    ],
  });

  useEffect(() => {
    (async () => {
      try {
        setDbStatus('Initializing database...');
        await initDb();
        await seedDemoData();
        const meds = await listMedications();
        console.log('[MemoryApp] medications:', meds);
        setDbStatus(`DB ready. Seeded meds: ${meds.length}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setDbStatus(`DB error: ${message}`);
        console.error('[MemoryApp] DB error:', error);
      }
    })();
  }, []);

  const handleAddReminder = (date: string, reminder: Reminder) => {
    setReminders((prev) => {
      const existing = prev[date] ?? [];
      return {
        ...prev,
        [date]: [...existing, reminder],
      };
    });
  };

  return (
    <ScrollView style={{ flex: 1, padding: 10 }}>
      <View style={{ marginBottom: 10, padding: 10, borderRadius: 8, backgroundColor: '#E2E8F0' }}>
        <Text style={{ color: '#0F172A', fontWeight: '600' }}>{dbStatus}</Text>
      </View>

      <Clock />
      <CalendarComponent reminders={reminders} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      {selectedDate && <AddReminderForm selectedDate={selectedDate} onAddReminder={handleAddReminder} />}
      {selectedDate && <DateCard date={selectedDate} reminders={reminders[selectedDate] || []} />}
    </ScrollView>
  );
}
