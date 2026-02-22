import React, { useState } from 'react';
import { View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Reminder } from '@/types';

interface CalendarComponentProps {
  reminders: Record<string, Reminder[]>;
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

export default function CalendarComponent({ reminders, selectedDate, onDateSelect }: CalendarComponentProps) {
  const getMarkedDates = () => {
    const marks: Record<string, { customStyles: any }> = {};

    Object.keys(reminders).forEach((date) => {
      marks[date] = {
        customStyles: {
          container: { backgroundColor: '#1E293B', borderRadius: 10, justifyContent: 'center', alignItems: 'center', height: 36, width: 36 },
          text: { color: '#E2E8F0', fontWeight: '700' },
        },
      };
    });

    if (selectedDate) {
      marks[selectedDate] = {
        customStyles: {
          container: { backgroundColor: '#6366F1', borderRadius: 10, justifyContent: 'center', alignItems: 'center', height: 36, width: 36 },
          text: { color: 'white', fontWeight: 'bold' },
        },
      };
    }

    return marks;
  };

  return (
    <View style={{ height: 350 }}>
      <Calendar
        onDayPress={(day) => onDateSelect(day.dateString)}
        markingType="custom"
        markedDates={getMarkedDates()}
        style={{ borderRadius: 18, overflow: 'hidden' }}
        theme={{
          calendarBackground: '#0F172A',
          monthTextColor: '#F8FAFC',
          textSectionTitleColor: '#94A3B8',
          dayTextColor: '#F8FAFC',
          textDisabledColor: '#475569',
          todayTextColor: '#A5B4FC',
          arrowColor: '#A5B4FC',
          textMonthFontWeight: '700',
          textDayFontWeight: '600',
          textDayHeaderFontWeight: '600',
        }}
      />
    </View>
  );
}
