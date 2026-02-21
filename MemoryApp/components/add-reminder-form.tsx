import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { Reminder } from '@/types';

interface AddReminderFormProps {
  selectedDate: string;
  onAddReminder: (date: string, reminder: Reminder) => void;
}

const TIME_REGEX = /^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/;

export default function AddReminderForm({ selectedDate, onAddReminder }: AddReminderFormProps) {
  const [text, setText] = useState('');
  const [time, setTime] = useState('');

  const handleAdd = () => {
    if (!selectedDate || !text) return;

    const trimmedTime = time.trim() || '00:00';
    const match = TIME_REGEX.exec(trimmedTime);

    if (!match) {
      Alert.alert('Invalid time', 'Please enter time in HH:MM or HH:MM AM/PM format.');
      return;
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const meridian = match[3]?.toLowerCase();

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 12 && meridian || // 12-hour format must be 1-12
      hours > 23 && !meridian || // 24-hour format must be 0-23
      minutes < 0 ||
      minutes > 59
    ) {
      Alert.alert('Invalid time', 'Hours must be 0-23 (24h) or 1-12 (AM/PM), minutes 0-59.');
      return;
    }

    // Normalize to HH:MM AM/PM
    let formattedTime = trimmedTime;
    if (!meridian) {
      // convert 24h to 12h with AM/PM
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 === 0 ? 12 : hours % 12;
      formattedTime = `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    onAddReminder(selectedDate, { text, time: formattedTime });
    setText('');
    setTime('');
  };

  return (
    <View style={{ marginVertical: 10 }}>
      <TextInput
        placeholder="Event description"
        value={text}
        onChangeText={setText}
        style={{ borderWidth: 1, padding: 8, marginBottom: 8, borderRadius: 4 }}
      />
      <TextInput
        placeholder="Time (HH:MM or HH:MM AM/PM)"
        value={time}
        onChangeText={setTime}
        style={{ borderWidth: 1, padding: 8, marginBottom: 8, borderRadius: 4 }}
      />
      <Button title="Add Reminder" onPress={handleAdd} />
    </View>
  );
}