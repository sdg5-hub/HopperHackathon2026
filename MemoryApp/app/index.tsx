import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Clock from '@/components/clock';
import CalendarComponent from '@/components/calendar-component';
import AddReminderForm from '@/components/add-reminder-form';
import DateCard from '@/components/date-card';
import type { Reminder } from '@/types';
import HistoryScreen from './history';

const parseReminderDate = (date: string, time: string) => {
  // Expect date in YYYY-MM-DD
  const parts = date.split('-').map((v) => Number(v));
  if (parts.length !== 3 || parts.some((v) => Number.isNaN(v))) return null;

  const [year, month, day] = parts;

  let hours = 0;
  let minutes = 0;

  const trimmedTime = time.trim();
  if (trimmedTime) {
    const match = /^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/.exec(trimmedTime);
    if (!match) return null;

    hours = Number(match[1]);
    minutes = Number(match[2]);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    const meridian = match[3]?.toLowerCase();
    if (meridian) {
      hours = hours % 12;
      if (meridian === 'pm') hours += 12;
    }
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState('');
  const [activeView, setActiveView] = useState<'calendar' | 'history'>('calendar');
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

  const handleAddReminder = (date: string, reminder: Reminder) => {
    const reminderDate = parseReminderDate(date, reminder.time);
    if (!reminderDate) return;

    setReminders((prev) => {
      const updated = { ...prev };
      if (!updated[date]) updated[date] = [];
      updated[date].push(reminder);
      return updated;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.switchRow}>
        <TouchableOpacity
          style={[styles.switchButton, activeView === 'calendar' && styles.switchButtonActive]}
          onPress={() => setActiveView('calendar')}
        >
          <Text style={[styles.switchText, activeView === 'calendar' && styles.switchTextActive]}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switchButton, activeView === 'history' && styles.switchButtonActive]}
          onPress={() => setActiveView('history')}
        >
          <Text style={[styles.switchText, activeView === 'history' && styles.switchTextActive]}>History</Text>
        </TouchableOpacity>
      </View>

      {activeView === 'calendar' ? (
        <ScrollView style={styles.calendarScroll}>
          <Clock />
          <CalendarComponent reminders={reminders} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
          {selectedDate && <AddReminderForm selectedDate={selectedDate} onAddReminder={handleAddReminder} />}
          {selectedDate && <DateCard date={selectedDate} reminders={reminders[selectedDate] || []} />}
        </ScrollView>
      ) : (
        <HistoryScreen />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 50,
    paddingHorizontal: 10,
  },
  switchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  switchButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#e6e6e6',
    alignItems: 'center',
  },
  switchButtonActive: {
    backgroundColor: '#2f6fe6',
  },
  switchText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  switchTextActive: {
    color: '#fff',
  },
  calendarScroll: {
    flex: 1,
  },
});