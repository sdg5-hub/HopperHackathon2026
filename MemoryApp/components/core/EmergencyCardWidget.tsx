import { Text, View } from 'react-native';
import { AppCard } from './AppCard';

type EmergencyData = {
  name: string;
  allergies: string;
  conditions: string;
  contactName: string;
  contactPhone: string;
};

export function EmergencyCardWidget({ data, medsSummary }: { data: EmergencyData; medsSummary: string[] }) {
  return (
    <AppCard>
      <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Emergency Card</Text>
      <Text style={{ color: '#B91C1C', fontWeight: '700' }}>In an emergency, call local emergency services.</Text>
      <Text style={{ color: '#334155' }}>Name: {data.name || '—'}</Text>
      <Text style={{ color: '#334155' }}>Allergies: {data.allergies || '—'}</Text>
      <Text style={{ color: '#334155' }}>Conditions: {data.conditions || '—'}</Text>
      <Text style={{ color: '#334155' }}>Emergency Contact: {data.contactName || '—'} {data.contactPhone ? `(${data.contactPhone})` : ''}</Text>
      <Text style={{ color: '#334155', fontWeight: '700' }}>Current meds:</Text>
      {medsSummary.length ? medsSummary.map((item) => <Text key={item} style={{ color: '#475569' }}>- {item}</Text>) : <Text style={{ color: '#64748B' }}>No active meds.</Text>}
    </AppCard>
  );
}
