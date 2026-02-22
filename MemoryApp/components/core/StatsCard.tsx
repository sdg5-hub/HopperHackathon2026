import { Text, View } from 'react-native';
import { AppCard } from './AppCard';

type Props = {
  streakDays: number;
  sevenDayAdherencePct: number;
  trendHint: string;
};

export function StatsCard({ streakDays, sevenDayAdherencePct, trendHint }: Props) {
  return (
    <AppCard>
      <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Adherence Stats</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: '#64748B' }}>Streak</Text>
          <Text style={{ color: '#0F172A', fontSize: 22, fontWeight: '800' }}>{streakDays} days</Text>
        </View>
        <View>
          <Text style={{ color: '#64748B' }}>7-day adherence</Text>
          <Text style={{ color: '#0F172A', fontSize: 22, fontWeight: '800' }}>{sevenDayAdherencePct}%</Text>
        </View>
      </View>
      <Text style={{ color: '#475569' }}>{trendHint}</Text>
    </AppCard>
  );
}
