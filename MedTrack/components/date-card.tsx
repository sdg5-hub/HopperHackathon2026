import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Reminder } from '@/types';
import { useTheme } from '@/theme';

type DateCardProps = {
  date: string;
  reminders: Reminder[];
};

export default function DateCard({ date, reminders }: DateCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <Text style={[styles.dateText, { color: theme.colors.text }]}>{date}</Text>
      {reminders.map((r, i) => (
        <Text key={i} style={[styles.reminderText, { color: theme.colors.mutedText }]}>
          {r.time} — {r.text}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
  },
  dateText: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  reminderText: { fontSize: 16, marginBottom: 4 },
});
