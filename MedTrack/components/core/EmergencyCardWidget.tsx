import { Text, View } from 'react-native';
import { AppCard } from './AppCard';
import { useTheme } from '@/theme';

type EmergencyData = {
  name: string;
  allergies: string;
  conditions: string;
  contactName: string;
  contactPhone: string;
};

export function EmergencyCardWidget({ data, medsSummary }: { data: EmergencyData; medsSummary: string[] }) {
  const theme = useTheme();

  return (
    <AppCard style={{ borderColor: '#FECACA', backgroundColor: theme.isDark ? '#2A1621' : '#FFF7F7' }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: theme.colors.text }}>Emergency Card</Text>
      <Text style={{ color: '#B91C1C', fontWeight: '700' }}>In an emergency, call local emergency services.</Text>
      <Text style={{ color: theme.colors.text }}>Name: {data.name || '—'}</Text>
      <Text style={{ color: theme.colors.text }}>Allergies: {data.allergies || '—'}</Text>
      <Text style={{ color: theme.colors.text }}>Conditions: {data.conditions || '—'}</Text>
      <Text style={{ color: theme.colors.text }}>Emergency Contact: {data.contactName || '—'} {data.contactPhone ? `(${data.contactPhone})` : ''}</Text>
      <Text style={{ color: theme.colors.text, fontWeight: '700' }}>Current meds:</Text>
      {medsSummary.length ? medsSummary.map((item) => <Text key={item} style={{ color: theme.colors.mutedText }}>- {item}</Text>) : <Text style={{ color: theme.colors.mutedText }}>No active meds.</Text>}
    </AppCard>
  );
}
