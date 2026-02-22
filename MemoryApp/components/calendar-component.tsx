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
          container: { backgroundColor: '#cce5ff', borderRadius: 0, justifyContent: 'center', alignItems: 'center', height: 40, width: 40 },
          text: { color: 'black', fontWeight: 'bold' },
        },
      };
    });

    if (selectedDate) {
      marks[selectedDate] = {
        customStyles: {
          container: { backgroundColor: '#0056b3', borderRadius: 0, justifyContent: 'center', alignItems: 'center', height: 40, width: 40 },
          text: { color: 'white', fontWeight: 'bold' },
        },
      };
    }

    return marks;
  };

  return (
    <View style={{ height: 350}}>
      <Calendar
        onDayPress={(day) => onDateSelect(day.dateString)}
        markingType="custom"
        markedDates={getMarkedDates()}
      />
    </View>
  );
}