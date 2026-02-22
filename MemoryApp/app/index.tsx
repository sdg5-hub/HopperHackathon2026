import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Clock from '@/components/clock';
import CalendarComponent from '@/components/calendar-component';
import AddReminderForm from '@/components/add-reminder-form';
import DateCard from '@/components/date-card';
import type { Reminder } from '@/types';
import HistoryScreen from './history';
import {
  initializeDatabase,
  loadRemindersFromDb,
  addReminderToDb,
  getDemoReminders,
  type ReminderItem,
  type RemindersByDate,
} from '@/services/reminderService';

const USE_DATABASE = true; // Toggle to switch between DB and demo data

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState('');
  const [activeView, setActiveView] = useState<'calendar' | 'history'>('calendar');
  const [reminders, setReminders] = useState<RemindersByDate>(getDemoReminders());
  const [loading, setLoading] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);

  // Initialize database on mount
  useEffect(() => {
    if (!USE_DATABASE) return;

    const init = async () => {
      try {
        setLoading(true);
        await initializeDatabase();
        setDbInitialized(true);
        await loadReminders();
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Load reminders from DB for a date range
  const loadReminders = async () => {
    if (!USE_DATABASE) return;

    try {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1); // 1 month ago
      const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0); // 2 months ahead

      const dbReminders = await loadRemindersFromDb(startDate, endDate);
      setReminders(dbReminders);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    }
  };

  const handleAddReminder = async (date: string, reminder: Reminder) => {
    try {
      if (USE_DATABASE && dbInitialized) {
        // Add to database
        const newReminder = await addReminderToDb(date, reminder.time, reminder.text);
        
        // Update local state
        setReminders((prev) => {
          const updated = { ...prev };
          if (!updated[date]) updated[date] = [];
          updated[date].push(newReminder);
          return updated;
        });
      } else {
        // Fallback to demo mode
        setReminders((prev) => {
          const updated = { ...prev };
          if (!updated[date]) updated[date] = [];
          updated[date].push({
            id: `demo-${Date.now()}`,
            time: reminder.time,
            text: reminder.text,
          });
          return updated;
        });
      }
    } catch (error) {
      console.error('Failed to add reminder:', error);
      alert('Failed to add reminder. Please try again.');
    }
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2f6fe6" />
          <Text style={styles.loadingText}>Loading reminders...</Text>
        </View>
      ) : activeView === 'calendar' ? (
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});